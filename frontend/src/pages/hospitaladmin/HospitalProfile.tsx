import React, { useEffect, useRef, useState } from 'react';
import { FiEdit2, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';
import { hospitalsApi } from '../../lib/api';
import type { Hospital } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

type ProfileForm = Pick<
  Hospital,
  | 'address'
  | 'municipality'
  | 'phone'
  | 'emergency_contact'
  | 'email'
  | 'website'
>;

type ProfileData = Hospital & {
  latitude?: string | number | null;
  longitude?: string | number | null;
};

const fields: {
  key: keyof ProfileForm;
  label: string;
  type: string;
  max?: number;
}[] = [
  { key: 'address', label: 'Address', type: 'text' },
  {
    key: 'municipality',
    label: 'Municipality',
    type: 'text',
    max: 100,
  },
  { key: 'phone', label: 'Phone', type: 'tel', max: 30 },
  {
    key: 'emergency_contact',
    label: 'Emergency Contact',
    type: 'tel',
    max: 30,
  },
  { key: 'email', label: 'Email', type: 'email', max: 254 },
  { key: 'website', label: 'Website', type: 'url', max: 200 },
];

const toForm = (hospital?: Hospital): ProfileForm => ({
  address: hospital?.address ?? '',
  municipality: hospital?.municipality ?? '',
  phone: hospital?.phone ?? '',
  emergency_contact: hospital?.emergency_contact ?? '',
  email: hospital?.email ?? '',
  website: hospital?.website ?? '',
});

function websiteLink(value: string): string | undefined {
  try {
    const url = new URL(value);

    return ['https:', 'http:'].includes(url.protocol)
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}

function contactLink(key: keyof ProfileForm, value: string) {
  if (key === 'website') {
    return websiteLink(value);
  }

  if (
    key === 'email' &&
    /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value)
  ) {
    return `mailto:${value}`;
  }

  if (key === 'phone' || key === 'emergency_contact') {
    const number = value.replace(/[\s().-]/g, '');

    if (/^\+?\d{3,20}$/.test(number)) {
      return `tel:${number}`;
    }
  }

  return undefined;
}

function errorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  const data: unknown = error.response?.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const messages = Object.entries(data).flatMap(([key, value]) => {
      const parts = Array.isArray(value) ? value : [value];

      return parts
        .filter((part): part is string => typeof part === 'string')
        .map((part) =>
          ['detail', 'non_field_errors'].includes(key)
            ? part
            : `${key.replace(/_/g, ' ')}: ${part}`,
        );
    });

    if (messages.length) return messages.join(' ');
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to edit this hospital.';
  }

  return fallback;
}

function coordinate(value: unknown, limit: number): string | null {
  if (value == null || value === '') return null;

  const number = Number(value);

  return Number.isFinite(number) && Math.abs(number) <= limit
    ? String(number)
    : null;
}

export const HospitalProfile: React.FC = () => {
  const { user } = useAuthStore();
  const hospitalId = user?.hospital;

  if (!hospitalId) {
    return (
      <div className="card">
        <h1 className="page-title">Hospital Profile</h1>
        <p>
          No hospital is assigned to your account. Contact your system
          administrator.
        </p>
      </div>
    );
  }

  return (
    <ProfileEditor
      key={`${user.id}-${hospitalId}-${user.role}`}
      hospitalId={hospitalId}
      canEdit={
        user.role === 'hospital_admin' ||
        user.role === 'system_admin'
      }
    />
  );
};

const ProfileEditor: React.FC<{
  hospitalId: number;
  canEdit: boolean;
}> = ({ hospitalId, canEdit }) => {
  const [hospital, setHospital] = useState<ProfileData | null>(null);
  const [form, setForm] = useState<ProfileForm>(() => toForm());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mustRefresh, setMustRefresh] = useState(false);
  const [revision, setRevision] = useState(0);

  const mounted = useRef(false);
  const saveBusy = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

    hospitalsApi
      .get(hospitalId)
      .then(({ data }) => {
        if (!active) return;

        if (data.id !== hospitalId) {
          throw new Error('Unexpected hospital response');
        }

        setHospital(data);
        setForm(toForm(data));
        setMustRefresh(false);
      })
      .catch((err: unknown) => {
        if (!active) return;

        setMustRefresh(true);
        setError(
          errorMessage(
            err,
            'Could not load the hospital profile. Please retry.',
          ),
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hospitalId, revision]);

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!hospital || !canEdit || saveBusy.current || mustRefresh) {
      return;
    }

    const payload = toForm();

    for (const { key } of fields) {
      payload[key] = form[key].trim();
    }

    if (!payload.address) {
      setError('Address is required.');
      return;
    }

    if (payload.website && !websiteLink(payload.website)) {
      setError('Website must be a valid http:// or https:// URL.');
      return;
    }

    // Send only edited fields.
    const changes: Partial<ProfileForm> = {};
    const original = toForm(hospital);

    for (const { key } of fields) {
      if (payload[key] !== original[key]) {
        changes[key] = payload[key];
      }
    }

    if (!Object.keys(changes).length) {
      setEditing(false);
      setError('');
      return;
    }

    saveBusy.current = true;
    setSaving(true);
    setError('');

    try {
      await hospitalsApi.update(hospitalId, changes);

      if (!mounted.current) return;

      toast.success('Hospital profile saved');
      setEditing(false);
      setMustRefresh(true);

      // The write response may omit services and other detail fields.
      try {
        const { data } = await hospitalsApi.get(hospitalId);

        if (!mounted.current) return;

        if (data.id !== hospitalId) {
          throw new Error('Unexpected hospital response');
        }

        setHospital(data);
        setForm(toForm(data));
        setMustRefresh(false);
      } catch {
        if (mounted.current) {
          setError(
            'Your changes were saved, but the updated profile could not be loaded. Refresh to see the latest data.',
          );
        }
      }
    } catch (err: unknown) {
      if (!mounted.current) return;

      const status = isAxiosError(err)
        ? err.response?.status
        : undefined;

      if (
        status === undefined ||
        status >= 500 ||
        status === 408 ||
        status === 409
      ) {
        setMustRefresh(true);
        setEditing(false);
        setError(
          'Could not confirm whether the changes were saved. Refresh and check the profile before editing again.',
        );
      } else {
        setError(
          errorMessage(err, 'Could not save the hospital profile.'),
        );
      }
    } finally {
      saveBusy.current = false;

      if (mounted.current) setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading profile…" />;
  }

  if (!hospital) {
    return (
      <div className="card">
        <p role="alert" className="mb-4 text-red-700">
          {error || 'Hospital not found.'}
        </p>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setRevision((value) => value + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  const latitude = coordinate(
    hospital.latitude ?? hospital.lat,
    90,
  );
  const longitude = coordinate(
    hospital.longitude ?? hospital.lng,
    180,
  );

  const contacts = fields.filter(
    ({ key }) => key !== 'address' && key !== 'municipality',
  );
  const services = hospital.services ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <form onSubmit={handleSave}>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title m-0">Hospital Profile</h1>
            <p className="mt-1 text-sm text-gray-500">
              {hospital.name}
            </p>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary"
                >
                  <FiCheck />
                  {saving ? 'Saving…' : 'Save'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  className="btn-secondary"
                  onClick={() => {
                    setForm(toForm(hospital));
                    setEditing(false);
                    setError('');
                  }}
                >
                  <FiX /> Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  className="btn-secondary"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  <FiRefreshCw /> Refresh
                </button>

                {canEdit && (
                  <button
                    type="button"
                    disabled={saving || mustRefresh}
                    className="btn-secondary"
                    onClick={() => {
                      setForm(toForm(hospital));
                      setError('');
                      setEditing(true);
                    }}
                  >
                    <FiEdit2 /> Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {!canEdit && (
          <p className="mb-4 text-sm text-gray-500">
            Only hospital administrators can edit this profile.
          </p>
        )}

        <div className="card mb-4">
          <h2 className="section-title">Hospital Information</h2>

          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Hospital Name', hospital.name],
              ['Type', hospital.type_display || hospital.type],
              ['District', hospital.district],
              ['Verification', hospital.verification_status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-xs text-gray-500">
                  {label}
                </dt>
                <dd className="font-medium text-gray-900">
                  {value || 'Not provided'}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {editing ? (
          <fieldset disabled={saving} className="card mb-4">
            <legend className="sr-only">
              Edit location and contact information
            </legend>

            <h2 className="section-title">
              Location and Contact Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ key, label, type, max }) => (
                <div
                  key={key}
                  className={
                    key === 'address' ? 'sm:col-span-2' : ''
                  }
                >
                  <label
                    htmlFor={`profile-${key}`}
                    className="label"
                  >
                    {label}
                    {key === 'address' ? ' *' : ''}
                  </label>

                  <input
                    id={`profile-${key}`}
                    type={type}
                    className="input"
                    maxLength={max}
                    required={key === 'address'}
                    value={form[key]}
                    placeholder={
                      key === 'website'
                        ? 'https://example.com'
                        : undefined
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ) : (
          <>
            <div className="card mb-4">
              <h2 className="section-title">Location</h2>

              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {[
                  hospital.address,
                  hospital.municipality,
                  hospital.district,
                ]
                  .filter(Boolean)
                  .join(', ') || 'Not provided'}
              </p>

              {latitude !== null && longitude !== null && (
                <p className="mt-2 text-xs text-gray-500">
                  Latitude: {latitude} · Longitude: {longitude}
                </p>
              )}
            </div>

            <div className="card mb-4">
              <h2 className="section-title">
                Contact Information
              </h2>

              <dl className="grid gap-3 sm:grid-cols-2">
                {contacts.map(({ key, label }) => {
                  const value = hospital[key]?.trim() || '';
                  const href = contactLink(key, value);

                  return (
                    <div
                      key={key}
                      className="min-w-0 rounded-lg bg-gray-50 p-3"
                    >
                      <dt className="mb-1 text-xs text-gray-500">
                        {label}
                      </dt>

                      <dd className="break-words text-sm text-gray-800">
                        {href ? (
                          <a
                            href={href}
                            target={
                              key === 'website'
                                ? '_blank'
                                : undefined
                            }
                            rel={
                              key === 'website'
                                ? 'noopener noreferrer'
                                : undefined
                            }
                            className="text-primary-700 hover:underline"
                          >
                            {value}
                          </a>
                        ) : (
                          value || 'Not provided'
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </>
        )}

        <div className="card">
          <h2 className="section-title">Services</h2>

          <div className="flex flex-wrap gap-2">
            {services.length ? (
              services.map((service) => {
                const detail = service as typeof service & {
                  service_detail?: { name?: string };
                };

                return (
                  <span
                    key={service.id}
                    className={`badge ${
                      service.is_available
                        ? 'border border-green-200 bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {detail.service_detail?.name ||
                      service.service_name ||
                      `Service ${service.service}`}
                  </span>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">
                No services are listed.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};