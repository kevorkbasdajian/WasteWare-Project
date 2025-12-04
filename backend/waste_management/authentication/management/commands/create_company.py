from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from authentication.models import Companies, Addresses

class Command(BaseCommand):
    help = 'Create a test company account'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='company@test.com')
        parser.add_argument('--password', type=str, default='company123')
        parser.add_argument('--name', type=str, default='Green Waste Solutions')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        name = options['name']

        # Check if company already exists
        if Companies.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(f'Company with email {email} already exists!'))
            company = Companies.objects.get(email=email)
            
            # Update password
            response = input(f'Update password for {email}? (yes/no): ')
            if response.lower() == 'yes':
                company.password_hash = make_password(password)
                company.save()
                self.stdout.write(self.style.SUCCESS(f'Password updated for {email}'))
            return

        # Create address for company
        address = Addresses.objects.create(
            street='123 Green Street',
            city='Beirut',
            region='Beirut',
            latitude=33.8938,
            longitude=35.5018,
            postal_code='1234'
        )

        # Create company
        company = Companies.objects.create(
            company_name=name,
            email=email,
            password_hash=make_password(password),
            phone_number='+1234567890',
            address=address,
            license_number='LIC-12345',
            verification_status='verified'
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully created company: {name}'))
        self.stdout.write(self.style.SUCCESS(f'Email: {email}'))
        self.stdout.write(self.style.SUCCESS(f'Password: {password}'))
        self.stdout.write(self.style.SUCCESS(f'Company ID: {company.company_id}'))