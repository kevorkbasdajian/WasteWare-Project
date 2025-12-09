from django.core.files.storage import Storage
from django.conf import settings
from supabase import create_client, Client
import os
from io import BytesIO
from urllib.parse import urljoin
import tempfile

class SupabaseStorage(Storage):
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket_name = settings.SUPABASE_BUCKET
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        
    def _normalize_name(self, name):
        """Normalize the file name"""
        return name.replace('\\', '/')
    
    def _save(self, name, content):
        """
        Save file to Supabase Storage.
        - Prefer passing raw bytes (works with storage3).
        - If not possible, write a temp file and pass its path string.
        Returns the storage key (name).
        """
        name = self._normalize_name(name)
        content_type = self._get_content_type(name)

        # Try to get raw bytes first
        file_bytes = None
        if hasattr(content, 'read'):
            try:
                content.seek(0)
            except Exception:
                pass
            try:
                file_bytes = content.read()
                if isinstance(file_bytes, memoryview):
                    file_bytes = bytes(file_bytes)
            except Exception:
                file_bytes = None
        elif isinstance(content, (bytes, bytearray)):
            file_bytes = bytes(content)

        def upload_using_bytes(bts):
            return self.client.storage.from_(self.bucket_name).upload(
                path=name,
                file=bts,
                file_options={"content-type": content_type}
            )

        def upload_using_path(path_str):
            return self.client.storage.from_(self.bucket_name).upload(
                path=name,
                file=path_str,
                file_options={"content-type": content_type}
            )

        # Attempt upload using bytes
        try:
            if file_bytes is not None:
                result = upload_using_bytes(file_bytes)
            else:
                # fallback: write a temp file and pass its path
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    chunk = content.read() if hasattr(content, 'read') else bytes(content)
                    tmp.write(chunk)
                    tmp_path = tmp.name
                try:
                    result = upload_using_path(tmp_path)
                finally:
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

            if isinstance(result, dict) and result.get('error'):
                raise Exception(result.get('error'))
            return name

        except Exception as exc:
            # Try update
            try:
                if file_bytes is not None:
                    upd = self.client.storage.from_(self.bucket_name).update(
                        path=name, file=file_bytes, file_options={"content-type": content_type}
                    )
                else:
                    with tempfile.NamedTemporaryFile(delete=False) as tmp:
                        tmp.write(content.read() if hasattr(content, 'read') else bytes(content))
                        tmp_path = tmp.name
                    try:
                        upd = self.client.storage.from_(self.bucket_name).update(
                            path=name, file=tmp_path, file_options={"content-type": content_type}
                        )
                    finally:
                        try: os.remove(tmp_path)
                        except Exception: pass

                if isinstance(upd, dict) and upd.get('error'):
                    raise Exception(upd.get('error'))
                return name

            except Exception:
                # Delete+upload fallback
                try:
                    try:
                        self.client.storage.from_(self.bucket_name).remove([name])
                    except Exception:
                        pass

                    if file_bytes is not None:
                        final = upload_using_bytes(file_bytes)
                    else:
                        with tempfile.NamedTemporaryFile(delete=False) as tmp:
                            tmp.write(content.read() if hasattr(content, 'read') else bytes(content))
                            tmp_path = tmp.name
                        try:
                            final = upload_using_path(tmp_path)
                        finally:
                            try: os.remove(tmp_path)
                            except Exception: pass

                    if isinstance(final, dict) and final.get('error'):
                        raise Exception(final.get('error'))
                    return name
                except Exception:
                    # if everything failed, re-raise last exception for visibility
                    raise


    def _open(self, name, mode='rb'):
        """Open file from Supabase Storage"""
        name = self._normalize_name(name)
        try:
            response = self.client.storage.from_(self.bucket_name).download(name)
            return BytesIO(response)
        except Exception as e:
            raise Exception(f"Failed to open file: {str(e)}")
    
    def delete(self, name):
        """Delete file from Supabase Storage"""
        name = self._normalize_name(name)
        try:
            self.client.storage.from_(self.bucket_name).remove([name])
        except Exception as e:
            print(f"Error deleting from Supabase: {str(e)}")
    
    def exists(self, name):
        """Check if file exists in Supabase Storage"""
        name = self._normalize_name(name)
        try:
            files = self.client.storage.from_(self.bucket_name).list()
            return any(f['name'] == name for f in files)
        except:
            return False
    
    def url(self, name):
        """Get public URL for file"""
        name = self._normalize_name(name)
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{name}"
    
    def size(self, name):
        """Get file size"""
        name = self._normalize_name(name)
        try:
            response = self.client.storage.from_(self.bucket_name).download(name)
            return len(response)
        except:
            return 0
    
    def _get_content_type(self, name):
        """Get content type based on file extension"""
        ext = os.path.splitext(name)[1].lower()
        content_types = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.pdf': 'application/pdf',
            '.mp4': 'video/mp4',
        }
        return content_types.get(ext, 'application/octet-stream')