from django.core.management.base import BaseCommand
import time
import threading
from company.tasks import update_pickup_statuses, simulate_truck_movements

class Command(BaseCommand):
    help = 'Run continuous pickup status updates and truck movement simulation'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting pickup simulator...'))
        
        def status_updater():
            while True:
                try:
                    update_pickup_statuses()
                    time.sleep(30)  # Check every 30 seconds
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Status update error: {e}'))
                    time.sleep(30)
        
        def movement_simulator():
            while True:
                try:
                    simulate_truck_movements()
                    time.sleep(10)  # Update positions every 10 seconds
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Movement simulation error: {e}'))
                    time.sleep(10)
        
        # Start both threads
        status_thread = threading.Thread(target=status_updater, daemon=True)
        movement_thread = threading.Thread(target=movement_simulator, daemon=True)
        
        status_thread.start()
        movement_thread.start()
        
        self.stdout.write(self.style.SUCCESS('Simulator running. Press Ctrl+C to stop.'))
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('Stopping simulator...'))