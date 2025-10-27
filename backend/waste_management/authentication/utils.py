from django.contrib.auth.hashers import make_password, check_password

def hash_password(raw_password):
    # Convert plain password to hashed password
    return make_password(raw_password)

def verify_password(raw_password, hashed_password):
    # Check if the password matches the hash
    return check_password(raw_password, hashed_password)
