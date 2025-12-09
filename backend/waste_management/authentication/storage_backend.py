from django.core.files.storage import Storage
from django.conf import settings
from supabase import create_client, Client
import os
from io import BytesIO
import tempfile

class SupabaseStorage(Storage):
    def _init_(self):
        self.supabase_url = settings.SUPABASE_URL
        self.supabase_key = settings.SUPABASE_KEY
        self.bucket_name = settings.SUPABASE_BUCKET
        self.client: Client = create_client(self.supabase_url, self.supabase_key)
        print(f"✅ SupabaseStorage initialized:")
        print(f"   URL: {self.supabase_url}")
        print(f"   Bucket: {self.bucket_name}")
        
    def _normalize_name(self, name):
        """Normalize the file name"""
        return name.replace('\\', '/')
    
    def _save(self, name, content):
        """
        Save file to Supabase Storage
        """
        name = self._normalize_name(name)
        content_type = self._get_content_type(name)
        
        print(f"\n{'='*60}")
        print(f"🔵 SAVE OPERATION STARTED")
        print(f"   File path: {name}")
        print(f"   Content type: {content_type}")
        print(f"{'='*60}")

        # Read file content
        try:
            if hasattr(content, 'seek'):
                content.seek(0)
            
            file_bytes = content.read() if hasattr(content, 'read') else bytes(content)
            
            if isinstance(file_bytes, memoryview):
                file_bytes = bytes(file_bytes)
            
            print(f"✅ File read successfully: {len(file_bytes)} bytes")
            
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            raise Exception(f"Failed to read file: {str(e)}")

        # Upload to Supabase
        try:
            print(f"🔵 Attempting upload to Supabase...")
            print(f"   Bucket: {self.bucket_name}")
            print(f"   Path: {name}")
            
            response = self.client.storage.from_(self.bucket_name).upload(
                path=name,
                file=file_bytes,
                file_options={
                    "content-type": content_type,
                    "upsert": "true"  # Overwrite if exists
                }
            )
            
            print(f"✅ Upload response: {response}")
            print(f"{'='*60}\n")
            return name
            
        except Exception as upload_error:
            print(f"❌ Upload failed: {upload_error}")
            print(f"   Error type: {type(upload_error)}")
            
            # Try to get more error details
            error_details = str(upload_error)
            print(f"   Error details: {error_details}")
            
            # Check if it's a duplicate file error - try update instead
            if "already exists" in error_details.lower() or "duplicate" in error_details.lower():
                try:
                    print(f"🔵 File exists, trying update...")
                    update_response = self.client.storage.from_(self.bucket_name).update(
                        path=name,
                        file=file_bytes,
                        file_options={"content-type": content_type}
                    )
                    print(f"✅ Update successful: {update_response}")
                    return name
                except Exception as update_error:
                    print(f"❌ Update failed: {update_error}")
            
            # If both upload and update fail, raise the error
            print(f"{'='*60}\n")
            raise Exception(f"Failed to save file to Supabase: {str(upload_error)}")

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
            print(f"🗑 Deleting file: {name}")
            self.client.storage.from_(self.bucket_name).remove([name])
            print(f"✅ File deleted successfully")
        except Exception as e:
            print(f"❌ Error deleting file: {str(e)}")
    
    def exists(self, name):
        """Check if file exists in Supabase Storage"""
        name = self._normalize_name(name)
        try:
            # Try to list the specific file
            path_parts = name.rsplit('/', 1)
            if len(path_parts) == 2:
                folder, filename = path_parts
                files = self.client.storage.from_(self.bucket_name).list(folder)
                return any(f['name'] == filename for f in files)
            else:
                files = self.client.storage.from_(self.bucket_name).list()
                return any(f['name'] == name for f in files)
        except:
            return False
    
    def url(self, name):
        """
        Return the FULL public URL for the file.
        This is what Django will store in the database.
        """
        if not name:
            return ""
        
        name = self._normalize_name(name)
        url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{name}"
        print(f"📎 Generated URL: {url}")
        return url
    
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