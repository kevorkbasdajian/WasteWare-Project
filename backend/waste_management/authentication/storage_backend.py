# your_app/storage_backends.py

from django.core.files.storage import Storage
from django.core.files.base import ContentFile
from django.conf import settings
import uuid

class SupabaseMediaStorage(Storage):
    def _save(self, name, content):
        """
        Save a file to Supabase Storage.
        """
        bucket_name = "images"  # your bucket name
        file_name = f"{uuid.uuid4()}_{name}"

        # Upload the file
        settings.SUPABASE.storage.from_(bucket_name).upload(
            file_name, content.read()
        )

        return file_name

    def url(self, name):
        """
        Get a signed URL for private files or public URL if public.
        """
        bucket_name = "images"
        # For private buckets, generate a signed URL
        signed_url = settings.SUPABASE.storage.from_(bucket_name).create_signed_url(name, 3600)
        return signed_url['signed_url']