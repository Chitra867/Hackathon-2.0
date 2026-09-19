"""
Idempotent seed data management command for UpacharKhoj Nepal.
Creates sample hospitals, services, users, availability, and referrals.
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
            self._create_sample_referrals(hospitals, services, health_workers, hospital_staff)

        self.stdout.write(self.style.SUCCESS('\nSeed data completed successfully!'))
        self.stdout.write('\nCredentials:')
        self.stdout.write('  System Admin:  admin / Admin@123')
        self.stdout.write('  Hospital Admin: hospital1_admin ... hospital5_admin / Admin@123')
        self.stdout.write('  Hospital Staff: hospital1_staff ... hospital5_staff / Staff@123')
        self.stdout.write('  Health Workers: hw1 / HealthWorker@123, hw2 / HealthWorker@123')

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

    # ------------------------------------------------------------------ #
    # Hospitals
    # ------------------------------------------------------------------ #

    def _create_hospitals(self):
        from apps.hospitals.models import Hospital
        hospitals_data = [
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
                'name': 'Lalitpur Metropolitan Hospital',
                'type': 'private',
                'address': 'Kumaripati, Lalitpur',
                'district': 'Lalitpur',
                'municipality': 'Lalitpur Metropolitan City',
                'latitude': '27.6588',
                'longitude': '85.3247',
                'phone': '01-5521481',
                'email': 'info@lalitpurhospital.com.np',
                'website': 'https://lalitpurhospital.com.np',
                'emergency_contact': '01-5521481',
                'verification_status': 'verified',
                'is_active': True,
            },
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

        # Teaching hospitals get all services
        teaching_hospitals = [h for h in hospitals if h.type == 'teaching']
        # District hospitals get core services
        district_hospitals = [h for h in hospitals if h.type == 'district']
        # Private hospitals get select services
        private_hospitals = [h for h in hospitals if h.type == 'private']

        core_service_names = [
            'Emergency Department', 'Emergency Surgery', 'Blood Bank',
            'Maternity / Obstetrics', 'Pediatrics', 'Orthopedics', 'CT Scan',
        ]
        private_service_names = [
            'Emergency Department', 'Cardiology', 'Maternity / Obstetrics',
            'Orthopedics', 'CT Scan', 'MRI', 'Pediatrics', 'ENT', 'Ophthalmology',
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
    # Availability data
    # ------------------------------------------------------------------ #

    def _create_availability(self, hospitals, services, updated_by):
        from apps.hospitals.models import Availability, HospitalService

        services_by_name = {service.name: service for service in services}

        templates = [
            {
                'availability_type': 'bed',
                'service_name': None,
                'available_count': 15,
                'total_count': 50,
            },
            {
                'availability_type': 'icu',
                'service_name': 'Intensive Care Unit (ICU)',
                'available_count': 2,
                'total_count': 8,
            },
            {
                'availability_type': 'nicu',
                'service_name': 'Neonatal ICU (NICU)',
                'available_count': 3,
                'total_count': 6,
            },
            {
                'availability_type': 'emergency',
                'service_name': 'Emergency Department',
                'available_count': None,
                'total_count': None,
            },
            {
                'availability_type': 'blood',
                'service_name': 'Blood Bank',
                'available_count': None,
                'total_count': None,
            },
            {
                'availability_type': 'test',
                'service_name': 'CT Scan',
                'available_count': None,
                'total_count': None,
            },
        ]

        created_count = 0
        status_cycle = ('available', 'limited', 'full')

        for hospital_index, hospital in enumerate(hospitals):
            if not hospital.is_active:
                continue

            enabled_service_ids = set(
                HospitalService.objects.filter(
                    hospital=hospital,
                    is_available=True,
                    service__is_active=True,
                ).values_list('service_id', flat=True)
            )

            for template_index, template in enumerate(templates):
                service = None
                service_name = template['service_name']

                if service_name:
                    service = services_by_name.get(service_name)
                    if service is None or service.pk not in enabled_service_ids:
                        continue

                available_count = template['available_count']
                total_count = template['total_count']

                if total_count is None:
                    current_status = 'available'
                    notes = 'Demo data: service marked available.'
                else:
                    current_status = status_cycle[
                        (hospital_index + template_index) % len(status_cycle)
                    ]

                    if current_status == 'full':
                        available_count = 0
                    elif current_status == 'limited':
                        available_count = max(1, total_count // 4)

                    notes = (
                        f'Demo data: {available_count} of {total_count} '
                        f'places available; status: {current_status}.'
                    )

                _, created = Availability.objects.get_or_create(
                    hospital=hospital,
                    availability_type=template['availability_type'],
                    service=service,
                    defaults={
                        'status': current_status,
                        'available_count': available_count,
                        'total_count': total_count,
                        'notes': notes,
                        'updated_by': updated_by,
                        'source': 'manual',
                        'is_active': True,
                    },
                )

                if created:
                    created_count += 1

        self.stdout.write(
            f'  Created {created_count} availability records. '
            'Existing records were left unchanged.'
        )
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

        referrals_data = [
            {
                'referring_facility': hospitals[0],
                'destination_facility': hospitals[1],
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
                'referring_facility': hospitals[2],
                'destination_facility': hospitals[0],
                'created_by': health_workers[0],
                'service': ct_service,
                'urgency': 'urgent',
                'patient_age': 34,
                'patient_gender': 'f',
                'patient_condition_summary': 'Head trauma following road accident, requires urgent CT scan.',
                'reason': 'CT scanner not available at referring facility.',
                'status': 'pending',
            },
            {
                'referring_facility': hospitals[3],
                'destination_facility': hospitals[0],
                'created_by': health_workers[1],
                'service': maternity_service,
                'urgency': 'urgent',
                'patient_age': 27,
                'patient_gender': 'f',
                'patient_condition_summary': 'High-risk pregnancy, placenta previa, requires specialist obstetric care.',
                'reason': 'High-risk obstetric management required.',
                'status': 'patient_sent',
            },
            {
                'referring_facility': hospitals[4],
                'destination_facility': hospitals[1],
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
                'referring_facility': hospitals[1],
                'destination_facility': hospitals[0],
                'created_by': health_workers[0],
                'service': None,
                'urgency': 'routine',
                'patient_age': 45,
                'patient_gender': 'm',
                'patient_condition_summary': 'Chronic kidney disease stage 4, requires nephrology evaluation.',
                'reason': 'Nephrologist not available at referring facility.',
                'status': 'patient_arrived',
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
