# authentication/storage_backend.py

from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils.deconstruct import deconstructible
import uuid
import os


@deconstructible
class SupabaseMediaStorage(Storage):
    """
    Custom storage backend for Supabase Storage
    """
    
    def __init__(self):
        self.bucket_name = "wasteware-media"
    
    def _save(self, name, content):
        """
        Save a file to Supabase Storage.
        Returns the filename (which will be stored as string in DB)
        """
        try:
            # Generate unique filename
            file_extension = os.path.splitext(name)[1].lower()
            file_name = f"{uuid.uuid4()}{file_extension}"
            
            # Read file content
            if hasattr(content, 'read'):
                file_content = content.read()
            else:
                file_content = content
            
            # Determine content type based on extension
            content_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
            }
            content_type = content_type_map.get(file_extension, 'image/jpeg')
            
            # Upload to Supabase
            settings.SUPABASE.storage.from_(self.bucket_name).upload(
                file_name, 
                file_content,
                file_options={"content-type": content_type}
            )
            
            # Return just the filename (not full URL)
            return file_name
            
        except Exception as e:
            print(f"Error uploading to Supabase: {e}")
            raise
    
    def _open(self, name, mode='rb'):
        """
        Retrieve a file from Supabase Storage
        """
        try:
            # Download file from Supabase
            response = settings.SUPABASE.storage.from_(self.bucket_name).download(name)
            return ContentFile(response)
        except Exception as e:
            print(f"Error downloading from Supabase: {e}")
            raise
    
    def exists(self, name):
        """
        Check if file exists in Supabase Storage
        """
        try:
            # Try to get file metadata
            files = settings.SUPABASE.storage.from_(self.bucket_name).list()
            return any(f['name'] == name for f in files)
        except:
            return False
    
    def url(self, name):
        """
        Return the URL for accessing the file
        """
        try:
            # Generate signed URL (valid for 1 hour)
            result = settings.SUPABASE.storage.from_(self.bucket_name).create_signed_url(
                name, 
                3600  # 1 hour expiry
            )
            return result.get('signedURL') or result.get('signed_url', '')
        except Exception as e:
            print(f"Error generating URL: {e}")
            return ''
    
    def delete(self, name):
        """
        Delete a file from Supabase Storage
        """
        try:
            settings.SUPABASE.storage.from_(self.bucket_name).remove([name])
        except Exception as e:
            print(f"Error deleting from Supabase: {e}")
    
    def size(self, name):
        """
        Return the size of the file
        """
        try:
            files = settings.SUPABASE.storage.from_(self.bucket_name).list()
            for f in files:
                if f['name'] == name:
                    return f.get('metadata', {}).get('size', 0)
            return 0
        except:
            return 0
    
    def get_available_name(self, name, max_length=None):
        """
        Return a filename that's available in the storage mechanism
        """
        # Always generate unique name
        file_extension = os.path.splitext(name)[1]
        return f"{uuid.uuid4()}{file_extension}"