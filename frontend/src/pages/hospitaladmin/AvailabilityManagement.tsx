import React, { useEffect, useRef, useState } from 'react';
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

import api, { availabilityApi } from '../../lib/api';
import type {
  Availability,
  AvailabilityStatus,
  HospitalService,
  PaginatedResponse,
  Service,
  User,
} from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';

const RESOURCE_TYPES = [
  { type: 'bed', label: 'General Beds', icon: '🛏' },
  { type: 'icu', label: 'ICU Beds', icon: '🏥' },
  { type: 'nicu', label: 'NICU', icon: '👶' },
  { type: 'emergency', label: 'Emergency', icon: '🚨' },
  { type: 'test', label: 'Tests / Dialysis', icon: '🔬' },
  { type: 'blood', label: 'Blood Bank', icon: '🩸' },
  { type: 'equipment', label: 'Equipment', icon: '⚙️' },
  { type: 'specialist', label: 'Specialists', icon: '👨‍⚕️' },
];

const STATUSES: AvailabilityStatus[] = [
  'available',
  'limited',
  'full',
  'unavailable',
  'unknown',
];

const SERVICE_CATEGORIES: Record<string, string[]> = {
  icu: ['icu'],
  nicu: ['nicu'],
  emergency: ['emergency'],
  test: ['ct', 'mri', 'dialysis', 'other'],
  blood: ['bloodbank'],
};

type RecordDetail = Availability & {
  service_detail?: { name?: string } | null;
};

type AccountDetail = User & {
  hospital_detail?: { name?: string } | null;
};

interface EditForm {
  recordId: number | null;
  type: string;
  serviceId: string;
  status: AvailabilityStatus;
  available: string;
  total: string;
  notes: string;
}

async function fetchPages<T extends { id: number }>(
  path: string,
  params: Record<string, string | number>,
  current: () => boolean,
): Promise<T[]> {
  const records = new Map<number, T>();
  let page = 1;

  while (current()) {
    const { data } = await api.get<PaginatedResponse<T>>(path, {
      params: { ...params, page },
    });

    if (!current()) return [];

    if (!Array.isArray(data.results)) {
      throw new Error('Unexpected API response.');
    }

    const previousSize = records.size;

    data.results.forEach((record) => {
      records.set(record.id, record);
    });

    if (!data.next) break;

    if (records.size === previousSize) {
      throw new Error('Pagination did not advance.');
    }

    page += 1;
  }

  return [...records.values()];
}

function readCount(value: string, label: string): number | null {
  const text = value.trim();

  if (!text) return null;

  if (!/^\d+$/.test(text)) {
    throw new Error(
      `${label} must be a whole number of zero or more.`,
    );
  }

  const count = Number(text);

  if (!Number.isSafeInteger(count)) {
    throw new Error(`${label} is too large.`);
  }

  return count;
}

function getError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;

  if (!error.response) {
    return 'Cannot reach the server. Check your connection.';
  }

  if (error.response.status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (error.response.status === 403) {
    return 'You do not have permission to update this hospital.';
  }

  if (error.response.status === 404) {
    return 'This record is no longer available.';
  }

  if (
    error.response.status === 400 ||
    error.response.status === 409
  ) {
    const data: unknown = error.response.data;

    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        const message =
          typeof value === 'string'
            ? value
            : Array.isArray(value) && typeof value[0] === 'string'
              ? value[0]
              : '';

        if (message) {
          return `${key.replace(/_/g, ' ')}: ${message}`;
        }
      }
    }
  }

  return fallback;
}

function displayDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Not reported'
    : date.toLocaleString();
}

export const AvailabilityManagement: React.FC = () => {
  const { user } = useAuthStore();
  const account = user as AccountDetail | null;
  const hospitalId = user?.hospital ?? null;

  const canEdit = Boolean(
    user &&
      ['hospital_admin', 'hospital_staff', 'system_admin'].includes(
        user.role,
      ),
  );

  const [records, setRecords] = useState<RecordDetail[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const [editor, setEditor] = useState<EditForm | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const version = useRef(0);
  const saveBusy = useRef(false);

  useEffect(() => {
    const token = ++version.current;
    const current = () => version.current === token;

    saveBusy.current = false;

    setSaving(false);
    setRecords([]);
    setServices([]);
    setEditor(null);
    setFormError('');
    setLoadError('');
    setNeedsRefresh(false);

    if (hospitalId === null) {
      setLoading(false);

      return () => {
        version.current += 1;
      };
    }

    setLoading(true);

    const load = async () => {
      try {
        const [allRecords, links, allServices] = await Promise.all([
          fetchPages<RecordDetail>(
            '/availability/',
            {
              hospital: hospitalId,
              ordering: '-updated_at',
            },
            current,
          ),
          fetchPages<HospitalService>(
            '/hospital-services/',
            {
              hospital: hospitalId,
              is_available: 'true',
            },
            current,
          ),
          fetchPages<Service>(
            '/services/',
            { is_active: 'true' },
            current,
          ),
        ]);

        if (!current()) return;

        const enabledIds = new Set(
          links
            .filter(
              (link) =>
                link.hospital === hospitalId && link.is_available,
            )
            .map((link) => link.service),
        );

        setRecords(
          allRecords.filter(
            (record) => record.hospital === hospitalId,
          ),
        );

        setServices(
          allServices
            .filter(
              (service) =>
                service.is_active && enabledIds.has(service.id),
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch (error) {
        if (current()) {
          setLoadError(
            getError(
              error,
              'Could not load availability and hospital services.',
            ),
          );
          setNeedsRefresh(true);
        }
      } finally {
        if (current()) setLoading(false);
      }
    };

    void load();

    return () => {
      version.current += 1;
    };
  }, [hospitalId, reloadKey]);

  const optionsFor = (type: string) => {
    if (type === 'bed') return [];

    const categories = SERVICE_CATEGORIES[type];

    return categories
      ? services.filter((service) =>
          categories.includes(service.category),
        )
      : services;
  };

  const startEdit = (record: RecordDetail) => {
    if (
      !canEdit ||
      saveBusy.current ||
      needsRefresh ||
      editor
    ) {
      return;
    }

    setFormError('');

    setEditor({
      recordId: record.id,
      type: record.availability_type,
      serviceId:
        record.service == null ? '' : String(record.service),
      status: record.status,
      available: record.available_count?.toString() ?? '',
      total: record.total_count?.toString() ?? '',
      notes: record.notes ?? '',
    });
  };

  const startCreate = (type: string) => {
    if (
      !canEdit ||
      saveBusy.current ||
      needsRefresh ||
      editor
    ) {
      return;
    }

    const options = optionsFor(type);

    setFormError('');

    setEditor({
      recordId: null,
      type,
      serviceId:
        SERVICE_CATEGORIES[type] && options.length === 1
          ? String(options[0].id)
          : '',
      status: 'unknown',
      available: '',
      total: '',
      notes: '',
    });
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !editor ||
      hospitalId === null ||
      !canEdit ||
      saveBusy.current ||
      needsRefresh
    ) {
      return;
    }

    const draft = { ...editor };
    const serviceId = draft.serviceId
      ? Number(draft.serviceId)
      : null;

    let available: number | null;
    let total: number | null;

    try {
      available = readCount(draft.available, 'Available count');
      total = readCount(draft.total, 'Total count');

      if (
        available !== null &&
        total !== null &&
        available > total
      ) {
        throw new Error(
          'Available count cannot exceed total count.',
        );
      }

      if (draft.status === 'full' && available !== 0) {
        throw new Error(
          'Use zero available count when the status is Full.',
        );
      }

      if (
        ['available', 'limited'].includes(draft.status) &&
        available === 0
      ) {
        throw new Error(
          'For zero available resources, choose Full, Unavailable, or Unknown.',
        );
      }

      if (draft.recordId === null) {
        if (
          SERVICE_CATEGORIES[draft.type] &&
          serviceId === null
        ) {
          throw new Error(
            'Select a service assigned to this hospital.',
          );
        }

        if (
          serviceId !== null &&
          !optionsFor(draft.type).some(
            (service) => service.id === serviceId,
          )
        ) {
          throw new Error(
            'Select a valid enabled hospital service.',
          );
        }
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : 'Check the entered values.',
      );
      return;
    }

    const token = version.current;
    const current = () => version.current === token;

    saveBusy.current = true;
    setSaving(true);
    setFormError('');

    let saved = false;

    try {
      const changes: Partial<Availability> = {
        status: draft.status,
        available_count: available,
        total_count: total,
        notes: draft.notes.trim(),
      };

      if (draft.recordId !== null) {
        // Preserve the existing hospital, service, type, and active flag.
        await availabilityApi.update(draft.recordId, changes);
      } else {
        // Check both active and inactive records before creating.
        const latest = await fetchPages<RecordDetail>(
          '/availability/',
          { hospital: hospitalId },
          current,
        );

        if (!current()) return;

        setRecords(
          latest.filter(
            (record) => record.hospital === hospitalId,
          ),
        );

        const existing = latest.find(
          (record) =>
            record.hospital === hospitalId &&
            record.availability_type === draft.type &&
            (record.service ?? null) === serviceId,
        );

        if (existing) {
          setFormError(
            existing.is_active
              ? 'This resource already has a record. Cancel and edit that record instead.'
              : 'An inactive record already exists. Ask your administrator to review and restore it if appropriate.',
          );
          return;
        }

        await availabilityApi.create({
          ...changes,
          hospital: hospitalId,
          availability_type: draft.type,
          service: serviceId,
          is_active: true,
        });
      }

      saved = true;

      if (!current()) return;

      setEditor(null);
      toast.success('Availability saved');

      // Write responses may omit IDs and timestamps.
      // Reload full records instead of treating them as display data.
      const latest = await fetchPages<RecordDetail>(
        '/availability/',
        {
          hospital: hospitalId,
          ordering: '-updated_at',
        },
        current,
      );

      if (current()) {
        setRecords(
          latest.filter(
            (record) => record.hospital === hospitalId,
          ),
        );
      }
    } catch (error) {
      if (!current()) return;

      setNeedsRefresh(true);

      if (saved) {
        setLoadError(
          'Your update was saved, but the list could not be refreshed. Select Refresh before editing again.',
        );
      } else {
        setFormError(
          `${getError(
            error,
            'Could not confirm that the update was saved.',
          )} Select Refresh to check the latest data before trying again.`,
        );
      }
    } finally {
      if (current()) {
        saveBusy.current = false;
        setSaving(false);
      }
    }
  };

  const renderEditor = () => {
    const draft = editor;
    if (!draft) return null;

    const requiresService = Boolean(
      SERVICE_CATEGORIES[draft.type],
    );
    const options = optionsFor(draft.type);

    return (
      <form onSubmit={handleSave} className="space-y-3">
        <fieldset
          disabled={saving || needsRefresh}
          className="space-y-3 disabled:opacity-60"
        >
          {draft.recordId === null && draft.type !== 'bed' && (
            <div>
              <label
                htmlFor="availability-service"
                className="label"
              >
                Service {requiresService ? '(required)' : '(optional)'}
              </label>

              <select
                id="availability-service"
                className="input"
                value={draft.serviceId}
                required={requiresService}
                onChange={(event) =>
                  setEditor({
                    ...draft,
                    serviceId: event.target.value,
                  })
                }
              >
                <option value="">
                  {requiresService
                    ? 'Select a hospital service'
                    : 'Hospital-wide resource (no service)'}
                </option>

                {options.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>

              {requiresService && options.length === 0 && (
                <p className="mt-1 text-xs text-amber-800">
                  Ask your system administrator to assign and enable
                  the appropriate service first.
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="availability-status" className="label">
              Status
            </label>

            <select
              id="availability-status"
              className="input"
              value={draft.status}
              onChange={(event) => {
                const status = event.target.value as AvailabilityStatus;

                setEditor({
                  ...draft,
                  status,
                  available:
                    status === 'full' ? '0' : draft.available,
                });
              }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="availability-count"
                className="label"
              >
                Available Count
              </label>

              <input
                id="availability-count"
                type="number"
                min="0"
                step="1"
                className="input"
                value={draft.available}
                placeholder="Unknown"
                onChange={(event) =>
                  setEditor({
                    ...draft,
                    available: event.target.value,
                  })
                }
              />
            </div>

            <div>
              <label
                htmlFor="availability-total"
                className="label"
              >
                Total Count
              </label>

              <input
                id="availability-total"
                type="number"
                min="0"
                step="1"
                className="input"
                value={draft.total}
                placeholder="Unknown"
                onChange={(event) =>
                  setEditor({
                    ...draft,
                    total: event.target.value,
                  })
                }
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Leave counts blank when unknown. Full requires zero
            available.
          </p>

          <div>
            <label htmlFor="availability-notes" className="label">
              Notes
            </label>

            <textarea
              id="availability-notes"
              className="input"
              rows={3}
              value={draft.notes}
              onChange={(event) =>
                setEditor({
                  ...draft,
                  notes: event.target.value,
                })
              }
            />
          </div>
        </fieldset>

        {formError && (
          <p role="alert" className="text-sm text-red-700">
            {formError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || needsRefresh}
            className="btn-primary disabled:opacity-50"
          >
            <FiCheck /> {saving ? 'Saving…' : 'Save'}
          </button>

          <button
            type="button"
            disabled={saving}
            className="btn-secondary disabled:opacity-50"
            onClick={() => {
              if (!saveBusy.current) {
                setEditor(null);
                setFormError('');
              }
            }}
          >
            <FiX /> Cancel
          </button>
        </div>
      </form>
    );
  };

  if (!user || hospitalId === null) {
    return (
      <div className="card" role="status">
        <h1 className="page-title">No hospital assigned</h1>
        <p>
          Sign in with a hospital account, or ask your system
          administrator to assign your hospital.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="Loading availability…" />;
  }

  const activeRecords = records.filter(
    (record) => record.is_active,
  );

  const unknownTypes = [
    ...new Set(
      activeRecords.map((record) => record.availability_type),
    ),
  ]
    .filter(
      (type) =>
        !RESOURCE_TYPES.some(
          (resource) => resource.type === type,
        ),
    )
    .map((type) => ({
      type,
      label: type.replace(/_/g, ' '),
      icon: '📋',
    }));

  const sections = [...RESOURCE_TYPES, ...unknownTypes];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Availability Management</h1>
          <p className="text-sm text-gray-500">
            Update availability for{' '}
            {account?.hospital_detail?.name ||
              user.hospital_name ||
              `Hospital #${hospitalId}`}
          </p>
        </div>

        <button
          type="button"
          disabled={
            saving || (editor !== null && !needsRefresh)
          }
          onClick={() => {
            if (!saveBusy.current) {
              setReloadKey((key) => key + 1);
            }
          }}
          className="btn-secondary disabled:opacity-50"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {loadError}
        </div>
      )}

      {needsRefresh && (
        <p
          role="status"
          className="mb-4 text-sm text-amber-800"
        >
          Editing is paused. Select Refresh to load the latest data.
          Any open draft will be cleared.
        </p>
      )}

      {!canEdit && (
        <p className="mb-4 text-sm text-gray-600">
          Your account can view this page but cannot edit availability.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(({ type, label, icon }) => {
          const group = activeRecords.filter(
            (record) => record.availability_type === type,
          );

          const creating =
            editor?.recordId === null &&
            editor.type === type;

          return (
            <section key={type} className="card">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-semibold text-gray-800">
                  <span aria-hidden="true" className="text-2xl">
                    {icon}
                  </span>
                  {label}
                </h2>

                {canEdit &&
                  RESOURCE_TYPES.some(
                    (resource) => resource.type === type,
                  ) && (
                    <button
                      type="button"
                      disabled={
                        saving ||
                        needsRefresh ||
                        editor !== null
                      }
                      onClick={() => startCreate(type)}
                      className="btn-secondary btn-sm disabled:opacity-50"
                    >
                      <FiPlus /> Add
                    </button>
                  )}
              </div>

              {group.length === 0 && !creating && (
                <p className="text-sm text-gray-500">
                  {needsRefresh
                    ? 'Records could not be confirmed.'
                    : 'No active records for this resource.'}
                </p>
              )}

              <div className="space-y-4">
                {group.map((record) => {
                  const editing =
                    editor?.recordId === record.id;

                  const serviceName =
                    record.service_detail?.name ||
                    record.service_name ||
                    services.find(
                      (service) =>
                        service.id === record.service,
                    )?.name ||
                    (
                      record.service == null
                        ? 'Hospital-wide resource'
                        : `Service #${record.service}`
                    );

                  return (
                    <div
                      key={record.id}
                      className={`rounded-lg border p-3 ${
                        editing
                          ? 'border-primary-300'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {serviceName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Updated {displayDate(record.updated_at)}
                          </p>
                        </div>

                        {canEdit && !editing && (
                          <button
                            type="button"
                            onClick={() => startEdit(record)}
                            disabled={
                              saving ||
                              needsRefresh ||
                              editor !== null
                            }
                            className="btn-secondary btn-sm disabled:opacity-50"
                          >
                            <FiEdit2 /> Edit
                          </button>
                        )}
                      </div>

                      {editing ? (
                        renderEditor()
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={record.status} />

                            <span className="text-sm text-gray-600">
                              {record.available_count == null
                                ? 'Available count not reported'
                                : `${
                                    record.available_count
                                  }${
                                    record.total_count == null
                                      ? ''
                                      : ` / ${record.total_count}`
                                  } available`}
                            </span>
                          </div>

                          {record.notes && (
                            <p className="whitespace-pre-wrap break-words text-xs text-gray-600">
                              {record.notes}
                            </p>
                          )}

                          {record.service != null &&
                            !services.some(
                              (service) =>
                                service.id === record.service,
                            ) && (
                              <p className="text-xs text-amber-800">
                                This service is no longer enabled for
                                this hospital. Ask your administrator
                                to review this record.
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {creating && (
                  <div className="rounded-lg border border-primary-300 p-3">
                    <h3 className="mb-3 font-semibold">
                      Add {label}
                    </h3>
                    {renderEditor()}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};