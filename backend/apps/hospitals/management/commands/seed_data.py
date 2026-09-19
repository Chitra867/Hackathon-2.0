"""
Idempotent seed data management command for UpacharKhoj Nepal.
Creates sample hospitals, services, users, availability, doctors,
patient requests, and referrals.
Safe to run multiple times — existing data is not duplicated.
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
import random


class Command(BaseCommand):
    help = 'Seed the database with sample data for UpacharKhoj Nepal.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Starting UpacharKhoj seed data...'))

        with transaction.atomic():
            admin_user = self._create_system_admin()
            services = self._create_services()
            hospitals = self._create_hospitals()
            self._create_hospital_services(hospitals, services)
            self._create_availability(hospitals, services, admin_user)
            hospital_admins = self._create_hospital_admins(hospitals)
            hospital_staff = self._create_hospital_staff(hospitals)
            health_workers = self._create_health_workers(hospitals)
            patient_users = self._create_patient_users()
            self._create_doctors(hospitals)
            self._create_sample_referrals(hospitals, services, health_workers, hospital_staff)
            self._create_patient_requests(hospitals, services, patient_users)

        self.stdout.write(self.style.SUCCESS('\nSeed data completed successfully!'))
        self.stdout.write('\nCredentials:')
        self.stdout.write('  System Admin:     admin / Admin@123')
        self.stdout.write('  Hospital Admins:  hospital1_admin ... hospital12_admin / Admin@123')
        self.stdout.write('  Hospital Staff:   hospital1_staff ... hospital12_staff / Staff@123')
        self.stdout.write('  Health Workers:   hw1, hw2, hw3 / HealthWorker@123')
        self.stdout.write('  Patients:         patient1, patient2, patient3 / Patient@123')

    # ------------------------------------------------------------------ #
    # Users
    # ------------------------------------------------------------------ #

    def _create_system_admin(self):
        from apps.accounts.models import User
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@upacharkhoj.np',
                'first_name': 'System',
                'last_name': 'Admin',
                'role': 'system_admin',
                'is_verified': True,
                'is_staff': True,
                'is_superuser': True,
                'phone': '01-4000000',
            }
        )
        if created:
            user.set_password('Admin@123')
            user.save()
            self.stdout.write(f'  Created system admin: {user.username}')
        else:
            self.stdout.write(f'  System admin already exists: {user.username}')
        return user

    def _create_hospital_admins(self, hospitals):
        from apps.accounts.models import User
        admins = []
        for i, hospital in enumerate(hospitals, start=1):
            username = f'hospital{i}_admin'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'admin.hospital{i}@upacharkhoj.np',
                    'first_name': f'Admin{i}',
                    'last_name': hospital.name.split()[0],
                    'role': 'hospital_admin',
                    'hospital': hospital,
                    'is_verified': True,
                    'phone': hospital.phone,
                }
            )
            if created:
                user.set_password('Admin@123')
                user.save()
                self.stdout.write(f'  Created hospital admin: {username}')
            admins.append(user)
        return admins

    def _create_hospital_staff(self, hospitals):
        from apps.accounts.models import User
        staff_list = []
        for i, hospital in enumerate(hospitals, start=1):
            username = f'hospital{i}_staff'
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'staff.hospital{i}@upacharkhoj.np',
                    'first_name': f'Staff{i}',
                    'last_name': hospital.name.split()[0],
                    'role': 'hospital_staff',
                    'hospital': hospital,
                    'is_verified': True,
                    'phone': hospital.phone,
                }
            )
            if created:
                user.set_password('Staff@123')
                user.save()
                self.stdout.write(f'  Created hospital staff: {username}')
            staff_list.append(user)
        return staff_list

    def _create_health_workers(self, hospitals):
        from apps.accounts.models import User
        health_workers = [
            {
                'username': 'hw1',
                'email': 'hw1@upacharkhoj.np',
                'first_name': 'Rajan',
                'last_name': 'Sharma',
                'hospital': hospitals[0],
                'phone': '9841000001',
            },
            {
                'username': 'hw2',
                'email': 'hw2@upacharkhoj.np',
                'first_name': 'Sita',
                'last_name': 'Thapa',
                'hospital': hospitals[1],
                'phone': '9841000002',
            },
            {
                'username': 'hw3',
                'email': 'hw3@upacharkhoj.np',
                'first_name': 'Bikram',
                'last_name': 'Karki',
                'hospital': hospitals[4],
                'phone': '9841000003',
            },
        ]
        created_hws = []
        for hw_data in health_workers:
            user, created = User.objects.get_or_create(
                username=hw_data['username'],
                defaults={
                    **hw_data,
                    'role': 'health_worker',
                    'is_verified': True,
                }
            )
            if created:
                user.set_password('HealthWorker@123')
                user.save()
                self.stdout.write(f"  Created health worker: {hw_data['username']}")
            created_hws.append(user)
        return created_hws

    def _create_patient_users(self):
        from apps.accounts.models import User
        patients_data = [
            {
                'username': 'patient1',
                'email': 'patient1@gmail.com',
                'first_name': 'Aarav',
                'last_name': 'Shrestha',
                'phone': '9800000001',
            },
            {
                'username': 'patient2',
                'email': 'patient2@gmail.com',
                'first_name': 'Priya',
                'last_name': 'Gautam',
                'phone': '9800000002',
            },
            {
                'username': 'patient3',
                'email': 'patient3@gmail.com',
                'first_name': 'Sunil',
                'last_name': 'Basnet',
                'phone': '9800000003',
            },
            {
                'username': 'patient4',
                'email': 'patient4@gmail.com',
                'first_name': 'Anita',
                'last_name': 'Rai',
                'phone': '9800000004',
            },
        ]
        patients = []
        for p_data in patients_data:
            user, created = User.objects.get_or_create(
                username=p_data['username'],
                defaults={
                    **p_data,
                    'role': 'user',
                    'is_verified': True,
                }
            )
            if created:
                user.set_password('Patient@123')
                user.save()
                self.stdout.write(f"  Created patient user: {p_data['username']}")
            patients.append(user)
        return patients

    # ------------------------------------------------------------------ #
    # Hospitals (12 hospitals across Nepal)
    # ------------------------------------------------------------------ #

    def _create_hospitals(self):
        from apps.hospitals.models import Hospital
        hospitals_data = [
            # --- Kathmandu Valley ---
            {
                'name': 'Tribhuvan University Teaching Hospital',
                'type': 'teaching',
                'address': 'Maharajgunj, Kathmandu',
                'district': 'Kathmandu',
                'municipality': 'Kathmandu Metropolitan City',
                'latitude': '27.7370',
                'longitude': '85.3333',
                'phone': '01-4412505',
                'email': 'info@tuth.edu.np',
                'website': 'https://tuth.edu.np',
                'emergency_contact': '01-4412303',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Bir Hospital',
                'type': 'teaching',
                'address': 'Mahaboudha, Kathmandu',
                'district': 'Kathmandu',
                'municipality': 'Kathmandu Metropolitan City',
                'latitude': '27.7042',
                'longitude': '85.3135',
                'phone': '01-4221119',
                'email': 'info@birhospital.gov.np',
                'website': 'https://birhospital.gov.np',
                'emergency_contact': '01-4221988',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Patan Hospital',
                'type': 'teaching',
                'address': 'Lagankhel, Lalitpur',
                'district': 'Lalitpur',
                'municipality': 'Lalitpur Metropolitan City',
                'latitude': '27.6588',
                'longitude': '85.3247',
                'phone': '01-5522266',
                'email': 'info@patanhospital.org.np',
                'website': 'https://patanhospital.org.np',
                'emergency_contact': '01-5522278',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Bhaktapur Hospital',
                'type': 'district',
                'address': 'Bhaktapur Durbar Square Road, Bhaktapur',
                'district': 'Bhaktapur',
                'municipality': 'Bhaktapur Municipality',
                'latitude': '27.6710',
                'longitude': '85.4298',
                'phone': '01-6611766',
                'email': 'info@bhaktapurhospital.gov.np',
                'website': '',
                'emergency_contact': '01-6611766',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Nepal Medical College Teaching Hospital',
                'type': 'teaching',
                'address': 'Jorpati, Kathmandu',
                'district': 'Kathmandu',
                'municipality': 'Kathmandu Metropolitan City',
                'latitude': '27.7469',
                'longitude': '85.3717',
                'phone': '01-4912180',
                'email': 'info@nmcth.edu.np',
                'website': 'https://nmcth.edu.np',
                'emergency_contact': '01-4912180',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Grande International Hospital',
                'type': 'private',
                'address': 'Dhapasi, Kathmandu',
                'district': 'Kathmandu',
                'municipality': 'Kathmandu Metropolitan City',
                'latitude': '27.7568',
                'longitude': '85.3284',
                'phone': '01-5159266',
                'email': 'info@grandehospital.com',
                'website': 'https://grandehospital.com',
                'emergency_contact': '01-5159266',
                'verification_status': 'verified',
                'is_active': True,
            },
            # --- Province No. 4 (Gandaki) ---
            {
                'name': 'Pokhara Academy of Health Sciences',
                'type': 'teaching',
                'address': 'Lekhnath, Pokhara',
                'district': 'Kaski',
                'municipality': 'Pokhara Metropolitan City',
                'latitude': '28.2096',
                'longitude': '83.9856',
                'phone': '061-565111',
                'email': 'info@pahs.edu.np',
                'website': 'https://pahs.edu.np',
                'emergency_contact': '061-565100',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Western Regional Hospital',
                'type': 'district',
                'address': 'Ramghat, Pokhara',
                'district': 'Kaski',
                'municipality': 'Pokhara Metropolitan City',
                'latitude': '28.2096',
                'longitude': '83.9736',
                'phone': '061-520066',
                'email': 'info@wrh.gov.np',
                'website': '',
                'emergency_contact': '061-520066',
                'verification_status': 'verified',
                'is_active': True,
            },
            # --- Province No. 3 / Bagmati ---
            {
                'name': 'Bharatpur Hospital',
                'type': 'district',
                'address': 'Bharatpur-10, Chitwan',
                'district': 'Chitwan',
                'municipality': 'Bharatpur Metropolitan City',
                'latitude': '27.6833',
                'longitude': '84.4333',
                'phone': '056-524985',
                'email': 'info@bharatpurhospital.gov.np',
                'website': '',
                'emergency_contact': '056-524985',
                'verification_status': 'verified',
                'is_active': True,
            },
            # --- Province No. 1 (Koshi) ---
            {
                'name': 'BP Koirala Institute of Health Sciences',
                'type': 'teaching',
                'address': 'Ghopa Camp, Dharan',
                'district': 'Sunsari',
                'municipality': 'Dharan Sub-Metropolitan City',
                'latitude': '26.8065',
                'longitude': '87.2847',
                'phone': '025-525555',
                'email': 'info@bpkihs.edu',
                'website': 'https://bpkihs.edu',
                'emergency_contact': '025-520011',
                'verification_status': 'verified',
                'is_active': True,
            },
            {
                'name': 'Koshi Hospital',
                'type': 'district',
                'address': 'Biratnagar, Morang',
                'district': 'Morang',
                'municipality': 'Biratnagar Metropolitan City',
                'latitude': '26.4661',
                'longitude': '87.2718',
                'phone': '021-528000',
                'email': 'info@koshihospital.gov.np',
                'website': '',
                'emergency_contact': '021-528000',
                'verification_status': 'verified',
                'is_active': True,
            },
            # --- Province No. 5 (Lumbini) ---
            {
                'name': 'Lumbini Provincial Hospital',
                'type': 'district',
                'address': 'Butwal, Rupandehi',
                'district': 'Rupandehi',
                'municipality': 'Butwal Sub-Metropolitan City',
                'latitude': '27.7006',
                'longitude': '83.4494',
                'phone': '071-540400',
                'email': 'info@lumbinihospital.gov.np',
                'website': '',
                'emergency_contact': '071-540400',
                'verification_status': 'verified',
                'is_active': True,
            },
        ]

        hospitals = []
        for data in hospitals_data:
            hospital, created = Hospital.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                self.stdout.write(f"  Created hospital: {hospital.name}")
            else:
                self.stdout.write(f"  Hospital already exists: {hospital.name}")
            hospitals.append(hospital)
        return hospitals

    # ------------------------------------------------------------------ #
    # Services
    # ------------------------------------------------------------------ #

    def _create_services(self):
        from apps.hospitals.models import Service
        services_data = [
            {'name': 'Intensive Care Unit (ICU)', 'category': 'icu', 'description': 'Critical care unit for severely ill patients requiring intensive monitoring and support.'},
            {'name': 'Neonatal ICU (NICU)', 'category': 'nicu', 'description': 'Specialized care for newborns, especially premature or critically ill neonates.'},
            {'name': 'CT Scan', 'category': 'ct', 'description': 'Computed Tomography imaging service for diagnostic purposes.'},
            {'name': 'MRI', 'category': 'mri', 'description': 'Magnetic Resonance Imaging for detailed soft tissue and neurological diagnostics.'},
            {'name': 'Dialysis', 'category': 'dialysis', 'description': 'Renal dialysis service for patients with chronic or acute kidney failure.'},
            {'name': 'Cardiology', 'category': 'cardiology', 'description': 'Diagnosis and treatment of heart and cardiovascular system disorders.'},
            {'name': 'Maternity / Obstetrics', 'category': 'maternity', 'description': 'Comprehensive maternity care including antenatal, delivery, and postnatal services.'},
            {'name': 'Blood Bank', 'category': 'bloodbank', 'description': 'Blood collection, storage, testing, and transfusion services.'},
            {'name': 'Emergency Surgery', 'category': 'surgery', 'description': '24/7 emergency surgical services.'},
            {'name': 'Emergency Department', 'category': 'emergency', 'description': '24/7 emergency and trauma care.'},
            {'name': 'Orthopedics', 'category': 'orthopedics', 'description': 'Treatment of musculoskeletal conditions, fractures, and joint disorders.'},
            {'name': 'Neurology', 'category': 'neurology', 'description': 'Diagnosis and treatment of neurological disorders.'},
            {'name': 'Pediatrics', 'category': 'pediatrics', 'description': 'Medical care for infants, children, and adolescents.'},
            {'name': 'Ophthalmology', 'category': 'ophthalmology', 'description': 'Eye care and surgical services.'},
            {'name': 'ENT', 'category': 'ent', 'description': 'Ear, Nose and Throat (ENT) specialist services.'},
        ]

        services = []
        for data in services_data:
            service, created = Service.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                self.stdout.write(f"  Created service: {service.name}")
            services.append(service)
        return services

    # ------------------------------------------------------------------ #
    # Hospital ↔ Service relationships
    # ------------------------------------------------------------------ #

    def _create_hospital_services(self, hospitals, services):
        from apps.hospitals.models import HospitalService

        teaching_hospitals = [h for h in hospitals if h.type == 'teaching']
        district_hospitals = [h for h in hospitals if h.type == 'district']
        private_hospitals = [h for h in hospitals if h.type == 'private']

        core_service_names = [
            'Emergency Department', 'Emergency Surgery', 'Blood Bank',
            'Maternity / Obstetrics', 'Pediatrics', 'Orthopedics', 'CT Scan',
            'Intensive Care Unit (ICU)',
        ]
        private_service_names = [
            'Emergency Department', 'Cardiology', 'Maternity / Obstetrics',
            'Orthopedics', 'CT Scan', 'MRI', 'Pediatrics', 'ENT',
            'Ophthalmology', 'Intensive Care Unit (ICU)', 'Dialysis',
            'Emergency Surgery', 'Blood Bank',
        ]

        services_by_name = {s.name: s for s in services}
        count = 0

        for hospital in teaching_hospitals:
            for service in services:
                _, created = HospitalService.objects.get_or_create(
                    hospital=hospital, service=service,
                    defaults={'is_available': True}
                )
                if created:
                    count += 1

        for hospital in district_hospitals:
            for name in core_service_names:
                service = services_by_name.get(name)
                if service:
                    _, created = HospitalService.objects.get_or_create(
                        hospital=hospital, service=service,
                        defaults={'is_available': True}
                    )
                    if created:
                        count += 1

        for hospital in private_hospitals:
            for name in private_service_names:
                service = services_by_name.get(name)
                if service:
                    _, created = HospitalService.objects.get_or_create(
                        hospital=hospital, service=service,
                        defaults={'is_available': True}
                    )
                    if created:
                        count += 1

        self.stdout.write(f'  Created {count} hospital-service relationships')

    # ------------------------------------------------------------------ #
    # Availability data (rich, varied per hospital)
    # ------------------------------------------------------------------ #

    def _create_availability(self, hospitals, services, updated_by):
        from apps.hospitals.models import Availability, HospitalService

        services_by_name = {service.name: service for service in services}

        # Per-hospital availability configs: (available, total, status_override)
        # None means auto-compute from status cycle
        hospital_configs = [
            # 0 - TUTH (large teaching): many beds, ICU limited
            {
                'bed': (30, 120, 'available'), 'icu': (3, 20, 'limited'),
                'nicu': (4, 10, 'limited'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
                'mri': (None, None, 'available'), 'dialysis': (5, 12, 'limited'),
            },
            # 1 - Bir Hospital: busy, limited
            {
                'bed': (5, 100, 'limited'), 'icu': (0, 15, 'full'),
                'nicu': (2, 8, 'limited'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'limited'),
                'mri': (None, None, 'available'), 'dialysis': (2, 10, 'limited'),
            },
            # 2 - Patan Hospital
            {
                'bed': (18, 80, 'available'), 'icu': (5, 12, 'available'),
                'nicu': (3, 6, 'available'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
                'mri': (None, None, 'limited'), 'dialysis': (4, 8, 'available'),
            },
            # 3 - Bhaktapur Hospital: small district, full beds
            {
                'bed': (0, 30, 'full'), 'icu': (1, 4, 'limited'),
                'nicu': (None, None, 'unavailable'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'limited'), 'ct': (None, None, 'available'),
            },
            # 4 - NMCTH
            {
                'bed': (22, 90, 'available'), 'icu': (6, 14, 'available'),
                'nicu': (3, 8, 'available'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
                'mri': (None, None, 'available'), 'dialysis': (3, 6, 'limited'),
            },
            # 5 - Grande (private): well-equipped
            {
                'bed': (25, 60, 'available'), 'icu': (8, 16, 'available'),
                'nicu': (4, 8, 'available'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
                'mri': (None, None, 'available'), 'dialysis': (6, 10, 'available'),
            },
            # 6 - PAHS Pokhara
            {
                'bed': (20, 75, 'available'), 'icu': (4, 10, 'available'),
                'nicu': (2, 6, 'limited'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
                'mri': (None, None, 'limited'), 'dialysis': (3, 8, 'available'),
            },
            # 7 - Western Regional Pokhara
            {
                'bed': (8, 50, 'limited'), 'icu': (2, 8, 'limited'),
                'nicu': (1, 4, 'limited'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
            },
            # 8 - Bharatpur Hospital
            {
                'bed': (12, 60, 'available'), 'icu': (3, 8, 'limited'),
                'nicu': (2, 4, 'available'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
            },
            # 9 - BPKIHS Dharan
            {
                'bed': (28, 110, 'available'), 'icu': (5, 18, 'available'),
                'nicu': (4, 10, 'available'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
                'mri': (None, None, 'available'), 'dialysis': (5, 12, 'available'),
            },
            # 10 - Koshi Hospital
            {
                'bed': (6, 70, 'limited'), 'icu': (1, 10, 'limited'),
                'nicu': (0, 4, 'full'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'limited'), 'ct': (None, None, 'limited'),
            },
            # 11 - Lumbini Provincial Hospital
            {
                'bed': (14, 55, 'available'), 'icu': (4, 8, 'available'),
                'nicu': (2, 4, 'limited'), 'emergency': (None, None, 'available'),
                'blood': (None, None, 'available'), 'ct': (None, None, 'available'),
            },
        ]

        type_to_service = {
            'icu': 'Intensive Care Unit (ICU)',
            'nicu': 'Neonatal ICU (NICU)',
            'ct': 'CT Scan',
            'mri': 'MRI',
            'dialysis': 'Dialysis',
            'blood': 'Blood Bank',
            'emergency': 'Emergency Department',
        }

        created_count = 0

        for hospital_index, hospital in enumerate(hospitals):
            if not hospital.is_active:
                continue

            config = hospital_configs[hospital_index] if hospital_index < len(hospital_configs) else {}

            enabled_service_ids = set(
                HospitalService.objects.filter(
                    hospital=hospital,
                    is_available=True,
                    service__is_active=True,
                ).values_list('service_id', flat=True)
            )

            # General beds (no linked service)
            if 'bed' in config:
                avail_count, total_count, status = config['bed']
                _, created = Availability.objects.get_or_create(
                    hospital=hospital,
                    availability_type='bed',
                    service=None,
                    defaults={
                        'status': status,
                        'available_count': avail_count,
                        'total_count': total_count,
                        'notes': f'General ward beds: {avail_count}/{total_count} available.',
                        'updated_by': updated_by,
                        'source': 'manual',
                        'is_active': True,
                    }
                )
                if created:
                    created_count += 1

            # Service-linked availability
            for avail_type, service_name in type_to_service.items():
                if avail_type not in config:
                    continue
                service = services_by_name.get(service_name)
                if service is None or service.pk not in enabled_service_ids:
                    continue

                vals = config[avail_type]
                avail_count, total_count, status = vals

                if total_count is not None:
                    notes = f'{service_name}: {avail_count}/{total_count} available. Status: {status}.'
                else:
                    notes = f'{service_name}: {status}.'

                _, created = Availability.objects.get_or_create(
                    hospital=hospital,
                    availability_type=avail_type,
                    service=service,
                    defaults={
                        'status': status,
                        'available_count': avail_count,
                        'total_count': total_count,
                        'notes': notes,
                        'updated_by': updated_by,
                        'source': 'manual',
                        'is_active': True,
                    }
                )
                if created:
                    created_count += 1

        self.stdout.write(
            f'  Created {created_count} availability records. '
            'Existing records were left unchanged.'
        )

    # ------------------------------------------------------------------ #
    # Doctors
    # ------------------------------------------------------------------ #

    def _create_doctors(self, hospitals):
        from apps.hospitals.models import Doctor

        if Doctor.objects.exists():
            self.stdout.write('  Doctors already exist, skipping.')
            return

        doctors_data = [
            # ----- TUTH (hospitals[0]) -----
            {'hospital': hospitals[0], 'name': 'Rajendra Sharma', 'specialty': 'Cardiology',
             'qualification': 'MD, DM (Cardiology) — AIIMS Delhi',
             'phone': '9841100001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[0], 'name': 'Sunita Adhikari', 'specialty': 'Neurology',
             'qualification': 'MD, DM (Neurology) — IOM Kathmandu',
             'phone': '9841100002', 'duty_status': 'on_duty',
             'consultation_days': 'Mon, Wed, Fri', 'consultation_time': '10:00 AM – 2:00 PM'},
            {'hospital': hospitals[0], 'name': 'Bibek Poudel', 'specialty': 'Orthopedics',
             'qualification': 'MS (Ortho) — IOM Kathmandu',
             'phone': '9841100003', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '8:00 AM – 12:00 PM'},
            {'hospital': hospitals[0], 'name': 'Kamala Maharjan', 'specialty': 'Obstetrics & Gynecology',
             'qualification': 'MD (OBG) — IOM Kathmandu',
             'phone': '9841100004', 'duty_status': 'on_leave',
             'consultation_days': 'Tue, Thu, Sat', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[0], 'name': 'Dipak Khadka', 'specialty': 'Emergency Medicine',
             'qualification': 'MD (Emergency Medicine)',
             'phone': '9841100005', 'duty_status': 'on_duty',
             'consultation_days': 'Mon–Sun (24/7)', 'consultation_time': '24 hours'},

            # ----- Bir Hospital (hospitals[1]) -----
            {'hospital': hospitals[1], 'name': 'Prakash Thapa', 'specialty': 'General Surgery',
             'qualification': 'MS (General Surgery) — IOM',
             'phone': '9841200001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[1], 'name': 'Meena Basnet', 'specialty': 'Pediatrics',
             'qualification': 'MD (Pediatrics) — IOM',
             'phone': '9841200002', 'duty_status': 'on_duty',
             'consultation_days': 'Sun, Tue, Thu', 'consultation_time': '10:00 AM – 1:00 PM'},
            {'hospital': hospitals[1], 'name': 'Anil Rana', 'specialty': 'Nephrology',
             'qualification': 'MD, DM (Nephrology)',
             'phone': '9841200003', 'duty_status': 'off_duty',
             'consultation_days': 'Mon, Wed', 'consultation_time': '2:00 PM – 5:00 PM'},

            # ----- Patan Hospital (hospitals[2]) -----
            {'hospital': hospitals[2], 'name': 'Sanjay Shrestha', 'specialty': 'Internal Medicine',
             'qualification': 'MD (Internal Medicine) — PAHS',
             'phone': '9841300001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 12:00 PM'},
            {'hospital': hospitals[2], 'name': 'Laxmi Tuladhar', 'specialty': 'Obstetrics & Gynecology',
             'qualification': 'MD (OBG)',
             'phone': '9841300002', 'duty_status': 'on_duty',
             'consultation_days': 'Sun, Mon, Wed, Fri', 'consultation_time': '8:00 AM – 12:00 PM'},
            {'hospital': hospitals[2], 'name': 'Roshan Joshi', 'specialty': 'Ophthalmology',
             'qualification': 'MS (Ophthalmology)',
             'phone': '9841300003', 'duty_status': 'on_duty',
             'consultation_days': 'Tue, Thu', 'consultation_time': '10:00 AM – 3:00 PM'},

            # ----- Bhaktapur Hospital (hospitals[3]) -----
            {'hospital': hospitals[3], 'name': 'Gopal Manandhar', 'specialty': 'General Medicine',
             'qualification': 'MBBS, MD',
             'phone': '9841400001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[3], 'name': 'Puja Rajbhandari', 'specialty': 'Pediatrics',
             'qualification': 'MBBS, MD (Pediatrics)',
             'phone': '9841400002', 'duty_status': 'on_duty',
             'consultation_days': 'Sun, Tue, Thu', 'consultation_time': '9:00 AM – 12:00 PM'},

            # ----- NMCTH (hospitals[4]) -----
            {'hospital': hospitals[4], 'name': 'Suresh Karmacharya', 'specialty': 'Cardiology',
             'qualification': 'MD, DM (Cardiology)',
             'phone': '9841500001', 'duty_status': 'on_duty',
             'consultation_days': 'Mon–Fri', 'consultation_time': '10:00 AM – 1:00 PM'},
            {'hospital': hospitals[4], 'name': 'Nirmala Chaudhary', 'specialty': 'Radiology',
             'qualification': 'MD (Radiology)',
             'phone': '9841500002', 'duty_status': 'on_duty',
             'consultation_days': 'Mon–Sat', 'consultation_time': '8:00 AM – 4:00 PM'},
            {'hospital': hospitals[4], 'name': 'Ramesh Giri', 'specialty': 'ENT',
             'qualification': 'MS (ENT)',
             'phone': '9841500003', 'duty_status': 'off_duty',
             'consultation_days': 'Mon, Wed, Fri', 'consultation_time': '2:00 PM – 5:00 PM'},

            # ----- Grande International (hospitals[5]) -----
            {'hospital': hospitals[5], 'name': 'Hemant Agrawal', 'specialty': 'Cardiac Surgery',
             'qualification': 'MCh (Cardiac Surgery) — AIIMS',
             'phone': '9841600001', 'duty_status': 'on_duty',
             'consultation_days': 'Mon–Fri', 'consultation_time': '9:00 AM – 12:00 PM'},
            {'hospital': hospitals[5], 'name': 'Sweta Bhattarai', 'specialty': 'Neurosurgery',
             'qualification': 'MCh (Neurosurgery)',
             'phone': '9841600002', 'duty_status': 'on_duty',
             'consultation_days': 'Mon, Wed, Fri', 'consultation_time': '11:00 AM – 2:00 PM'},
            {'hospital': hospitals[5], 'name': 'Nabin Pradhan', 'specialty': 'Oncology',
             'qualification': 'MD, DM (Oncology)',
             'phone': '9841600003', 'duty_status': 'on_duty',
             'consultation_days': 'Tue, Thu, Sat', 'consultation_time': '10:00 AM – 1:00 PM'},

            # ----- PAHS Pokhara (hospitals[6]) -----
            {'hospital': hospitals[6], 'name': 'Anup Gurung', 'specialty': 'General Surgery',
             'qualification': 'MS (Surgery)',
             'phone': '9846100001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[6], 'name': 'Sabina Panta', 'specialty': 'Obstetrics & Gynecology',
             'qualification': 'MD (OBG)',
             'phone': '9846100002', 'duty_status': 'on_duty',
             'consultation_days': 'Sun, Mon, Wed', 'consultation_time': '8:30 AM – 12:00 PM'},
            {'hospital': hospitals[6], 'name': 'Kiran Oli', 'specialty': 'Pediatrics',
             'qualification': 'MD (Pediatrics)',
             'phone': '9846100003', 'duty_status': 'on_leave',
             'consultation_days': 'Tue, Thu', 'consultation_time': '10:00 AM – 1:00 PM'},

            # ----- Western Regional (hospitals[7]) -----
            {'hospital': hospitals[7], 'name': 'Mohan Budathoki', 'specialty': 'Internal Medicine',
             'qualification': 'MBBS, MD',
             'phone': '9846200001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 12:00 PM'},
            {'hospital': hospitals[7], 'name': 'Rekha Thapa', 'specialty': 'Orthopedics',
             'qualification': 'MS (Ortho)',
             'phone': '9846200002', 'duty_status': 'on_duty',
             'consultation_days': 'Mon, Wed, Fri', 'consultation_time': '9:00 AM – 1:00 PM'},

            # ----- Bharatpur Hospital (hospitals[8]) -----
            {'hospital': hospitals[8], 'name': 'Bijay Neupane', 'specialty': 'General Medicine',
             'qualification': 'MBBS, MD',
             'phone': '9855100001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[8], 'name': 'Mina Dhakal', 'specialty': 'Maternity',
             'qualification': 'MBBS, MS (OBG)',
             'phone': '9855100002', 'duty_status': 'on_duty',
             'consultation_days': 'Sun, Tue, Thu', 'consultation_time': '8:00 AM – 12:00 PM'},

            # ----- BPKIHS Dharan (hospitals[9]) -----
            {'hospital': hospitals[9], 'name': 'Dr. Rajesh Yadav', 'specialty': 'Oncology',
             'qualification': 'MD, DM (Oncology) — TATA Cancer Centre',
             'phone': '9842100001', 'duty_status': 'on_duty',
             'consultation_days': 'Mon–Fri', 'consultation_time': '9:00 AM – 12:00 PM'},
            {'hospital': hospitals[9], 'name': 'Priya Limbu', 'specialty': 'Neurology',
             'qualification': 'MD, DM (Neurology)',
             'phone': '9842100002', 'duty_status': 'on_duty',
             'consultation_days': 'Mon, Wed, Fri', 'consultation_time': '10:00 AM – 1:00 PM'},
            {'hospital': hospitals[9], 'name': 'Santosh Rai', 'specialty': 'Cardiology',
             'qualification': 'MD, DM (Cardiology)',
             'phone': '9842100003', 'duty_status': 'off_duty',
             'consultation_days': 'Tue, Thu', 'consultation_time': '2:00 PM – 5:00 PM'},

            # ----- Koshi Hospital (hospitals[10]) -----
            {'hospital': hospitals[10], 'name': 'Binod Shah', 'specialty': 'General Surgery',
             'qualification': 'MBBS, MS',
             'phone': '9852100001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[10], 'name': 'Lata Chaurasiya', 'specialty': 'Gynecology',
             'qualification': 'MBBS, MD (OBG)',
             'phone': '9852100002', 'duty_status': 'on_duty',
             'consultation_days': 'Mon, Wed, Sat', 'consultation_time': '9:00 AM – 12:00 PM'},

            # ----- Lumbini Provincial (hospitals[11]) -----
            {'hospital': hospitals[11], 'name': 'Suresh Tiwari', 'specialty': 'Internal Medicine',
             'qualification': 'MBBS, MD',
             'phone': '9857100001', 'duty_status': 'on_duty',
             'consultation_days': 'Sun–Fri', 'consultation_time': '9:00 AM – 1:00 PM'},
            {'hospital': hospitals[11], 'name': 'Kabita Pandey', 'specialty': 'Pediatrics',
             'qualification': 'MBBS, MD (Pediatrics)',
             'phone': '9857100002', 'duty_status': 'on_duty',
             'consultation_days': 'Sun, Tue, Thu', 'consultation_time': '10:00 AM – 1:00 PM'},
            {'hospital': hospitals[11], 'name': 'Arun Mishra', 'specialty': 'Orthopedics',
             'qualification': 'MBBS, MS (Ortho)',
             'phone': '9857100003', 'duty_status': 'on_leave',
             'consultation_days': 'Mon, Wed', 'consultation_time': '2:00 PM – 5:00 PM'},
        ]

        count = 0
        for d in doctors_data:
            Doctor.objects.create(**d)
            count += 1

        self.stdout.write(f'  Created {count} doctors across all hospitals.')

    # ------------------------------------------------------------------ #
    # Sample referrals
    # ------------------------------------------------------------------ #

    def _create_sample_referrals(self, hospitals, services, health_workers, hospital_staff):
        from apps.referrals.models import Referral, ReferralEvent

        if Referral.objects.exists():
            self.stdout.write('  Sample referrals already exist, skipping.')
            return

        services_by_cat = {s.category: s for s in services}
        icu_service = services_by_cat.get('icu')
        ct_service = services_by_cat.get('ct')
        maternity_service = services_by_cat.get('maternity')
        neuro_service = services_by_cat.get('neurology')

        referrals_data = [
            {
                'referring_facility': hospitals[3],   # Bhaktapur
                'destination_facility': hospitals[0], # TUTH
                'created_by': health_workers[0],
                'service': icu_service,
                'urgency': 'emergency',
                'patient_age': 52,
                'patient_gender': 'm',
                'patient_condition_summary': 'Acute MI with cardiogenic shock, requires ICU and cardiac intervention.',
                'reason': 'Insufficient ICU capacity at referring facility.',
                'status': 'accepted',
            },
            {
                'referring_facility': hospitals[7],   # Western Regional
                'destination_facility': hospitals[6], # PAHS
                'created_by': health_workers[2],
                'service': ct_service,
                'urgency': 'urgent',
                'patient_age': 34,
                'patient_gender': 'f',
                'patient_condition_summary': 'Head trauma following road accident, requires urgent CT scan.',
                'reason': 'CT scanner not available at referring facility.',
                'status': 'pending',
            },
            {
                'referring_facility': hospitals[8],   # Bharatpur
                'destination_facility': hospitals[6], # PAHS
                'created_by': health_workers[2],
                'service': maternity_service,
                'urgency': 'urgent',
                'patient_age': 27,
                'patient_gender': 'f',
                'patient_condition_summary': 'High-risk pregnancy, placenta previa, requires specialist obstetric care.',
                'reason': 'High-risk obstetric management required.',
                'status': 'patient_sent',
            },
            {
                'referring_facility': hospitals[10],  # Koshi
                'destination_facility': hospitals[9], # BPKIHS
                'created_by': health_workers[1],
                'service': icu_service,
                'urgency': 'emergency',
                'patient_age': 68,
                'patient_gender': 'm',
                'patient_condition_summary': 'Severe respiratory distress, likely pneumonia, O2 sat 82%.',
                'reason': 'Ventilator support required.',
                'status': 'call_required',
            },
            {
                'referring_facility': hospitals[2],   # Patan
                'destination_facility': hospitals[0], # TUTH
                'created_by': health_workers[0],
                'service': neuro_service,
                'urgency': 'routine',
                'patient_age': 45,
                'patient_gender': 'm',
                'patient_condition_summary': 'Chronic kidney disease stage 4, requires nephrology evaluation.',
                'reason': 'Nephrologist not available at referring facility.',
                'status': 'patient_arrived',
            },
            {
                'referring_facility': hospitals[11],  # Lumbini
                'destination_facility': hospitals[6], # PAHS
                'created_by': health_workers[2],
                'service': icu_service,
                'urgency': 'emergency',
                'patient_age': 5,
                'patient_gender': 'm',
                'patient_condition_summary': 'Child with severe febrile convulsions, requires paediatric ICU.',
                'reason': 'No paediatric ICU at referring facility.',
                'status': 'accepted',
            },
            {
                'referring_facility': hospitals[1],   # Bir
                'destination_facility': hospitals[5], # Grande
                'created_by': health_workers[0],
                'service': ct_service,
                'urgency': 'urgent',
                'patient_age': 60,
                'patient_gender': 'f',
                'patient_condition_summary': 'Suspected stroke, needs urgent MRI/CT and neurology consult.',
                'reason': 'MRI machine under maintenance at referring facility.',
                'status': 'pending',
            },
        ]

        for data in referrals_data:
            referral = Referral.objects.create(**data)
            ReferralEvent.objects.create(
                referral=referral,
                actor=data['created_by'],
                old_status='',
                new_status='pending',
                note='Referral created.',
            )

            if data['status'] != 'pending':
                responding_staff = None
                for staff in hospital_staff:
                    if staff.hospital == data['destination_facility']:
                        responding_staff = staff
                        break

                if data['status'] in ('accepted', 'call_required', 'rejected'):
                    ReferralEvent.objects.create(
                        referral=referral,
                        actor=responding_staff,
                        old_status='pending',
                        new_status=data['status'],
                        note=f"Referral {data['status']} by destination facility.",
                    )
                elif data['status'] == 'patient_sent':
                    ReferralEvent.objects.create(
                        referral=referral,
                        actor=responding_staff,
                        old_status='pending',
                        new_status='accepted',
                        note='Referral accepted.',
                    )
                    ReferralEvent.objects.create(
                        referral=referral,
                        actor=data['created_by'],
                        old_status='accepted',
                        new_status='patient_sent',
                        note='Patient dispatched to destination hospital.',
                    )
                elif data['status'] == 'patient_arrived':
                    ReferralEvent.objects.create(
                        referral=referral,
                        actor=responding_staff,
                        old_status='pending',
                        new_status='accepted',
                        note='Referral accepted.',
                    )
                    ReferralEvent.objects.create(
                        referral=referral,
                        actor=data['created_by'],
                        old_status='accepted',
                        new_status='patient_sent',
                        note='Patient dispatched.',
                    )
                    ReferralEvent.objects.create(
                        referral=referral,
                        actor=responding_staff,
                        old_status='patient_sent',
                        new_status='patient_arrived',
                        note='Patient arrived and received.',
                    )

        self.stdout.write(f'  Created {len(referrals_data)} sample referrals')

    # ------------------------------------------------------------------ #
    # Patient requests (user-facing)
    # ------------------------------------------------------------------ #

    def _create_patient_requests(self, hospitals, services, patient_users):
        from apps.hospitals.models import PatientRequest

        if PatientRequest.objects.exists():
            self.stdout.write('  Patient requests already exist, skipping.')
            return

        services_by_cat = {s.category: s for s in services}

        requests_data = [
            {
                'patient': patient_users[0],
                'destination_hospital': hospitals[0],  # TUTH
                'service': services_by_cat.get('icu'),
                'contact_phone': '9800000001',
                'patient_age': 60,
                'condition_summary': 'Elderly patient with chest pain and shortness of breath. Possibly cardiac event.',
                'notes': 'Patient is hypertensive and diabetic. On regular medications.',
                'status': 'accepted',
                'response_note': 'ICU bed available. Please bring the patient immediately.',
            },
            {
                'patient': patient_users[1],
                'destination_hospital': hospitals[2],  # Patan
                'service': services_by_cat.get('maternity'),
                'contact_phone': '9800000002',
                'patient_age': 28,
                'condition_summary': 'Third trimester pregnancy with high blood pressure readings.',
                'notes': 'First pregnancy. Husband will accompany.',
                'status': 'pending',
                'response_note': '',
            },
            {
                'patient': patient_users[2],
                'destination_hospital': hospitals[5],  # Grande
                'service': services_by_cat.get('orthopedics'),
                'contact_phone': '9800000003',
                'patient_age': 35,
                'condition_summary': 'Motorcycle accident, suspected femur fracture. Unable to walk.',
                'notes': 'X-ray done at clinic, fracture confirmed.',
                'status': 'accepted',
                'response_note': 'Orthopedic surgeon on call. Please arrive at emergency entrance.',
            },
            {
                'patient': patient_users[3],
                'destination_hospital': hospitals[6],  # PAHS
                'service': services_by_cat.get('ct'),
                'contact_phone': '9800000004',
                'patient_age': 45,
                'condition_summary': 'Severe headache for 2 days, dizziness. Doctor advised CT scan.',
                'notes': 'Referred by local clinic in Pokhara.',
                'status': 'call_required',
                'response_note': 'Please call 061-565111 to confirm appointment before arriving.',
            },
            {
                'patient': patient_users[0],
                'destination_hospital': hospitals[9],  # BPKIHS
                'service': services_by_cat.get('dialysis'),
                'contact_phone': '9800000001',
                'patient_age': 55,
                'condition_summary': 'CKD Stage 5, requires urgent dialysis. Regular dialysis centre closed.',
                'notes': 'Patient on thrice-weekly dialysis routine.',
                'status': 'pending',
                'response_note': '',
            },
            {
                'patient': patient_users[1],
                'destination_hospital': hospitals[1],  # Bir
                'service': services_by_cat.get('nicu'),
                'contact_phone': '9800000002',
                'patient_age': 0,
                'condition_summary': 'Premature newborn (32 weeks), requires NICU care.',
                'notes': 'Mother stable. Baby born at home, breathing irregular.',
                'status': 'rejected',
                'response_note': 'NICU is at full capacity. Please try Patan Hospital or TUTH.',
            },
            {
                'patient': patient_users[2],
                'destination_hospital': hospitals[4],  # NMCTH
                'service': services_by_cat.get('emergency'),
                'contact_phone': '9800000003',
                'patient_age': 22,
                'condition_summary': 'Acute appendicitis suspected. Severe abdominal pain since 6 hours.',
                'notes': 'Fever 102°F. Nausea and vomiting present.',
                'status': 'accepted',
                'response_note': 'Surgery team on standby. Come directly to emergency.',
            },
            {
                'patient': patient_users[3],
                'destination_hospital': hospitals[8],  # Bharatpur
                'service': services_by_cat.get('pediatrics'),
                'contact_phone': '9800000004',
                'patient_age': 3,
                'condition_summary': 'Toddler with high fever and rash. Possible dengue.',
                'notes': 'Platelets slightly low on home test kit.',
                'status': 'pending',
                'response_note': '',
            },
        ]

        count = 0
        for data in requests_data:
            response_note = data.pop('response_note')
            req = PatientRequest.objects.create(**data)
            if response_note:
                req.response_note = response_note
                req.save()
            count += 1

        self.stdout.write(f'  Created {count} patient requests.')
