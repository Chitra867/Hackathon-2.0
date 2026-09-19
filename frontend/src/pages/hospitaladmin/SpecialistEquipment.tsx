import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  FiEdit2,
  FiCheck,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi';

import toast from 'react-hot-toast';

import { availabilityApi } from '../../lib/api';

import type { Availability } from '../../types';

import { StatusBadge } from '../../components/common/StatusBadge';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import { useAuthStore } from '../../store/authStore';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const PAGE_SIZE = 100;

const SPECIALISTS = [
  {
    key: 'specialist_doctor',
    label: 'Doctor on Duty',
    icon: '👨‍⚕️',
  },
  {
    key: 'specialist_cardiologist',
    label: 'Cardiologist',
    icon: '❤️',
  },
  {
    key: 'specialist_neurologist',
    label: 'Neurologist',
    icon: '🧠',
  },
  {
    key: 'specialist_orthopedic',
    label: 'Orthopedic Surgeon',
    icon: '🦴',
  },
  {
    key: 'specialist_pediatrician',
    label: 'Pediatrician',
    icon: '👶',
  },
  {
    key: 'specialist_obgyn',
    label: 'Ob/Gyn',
    icon: '🤱',
  },
] as const;

const EQUIPMENT = [
  {
    key: 'equipment_mri',
    label: 'MRI Machine',
    icon: '🔬',
  },
  {
    key: 'equipment_ct',
    label: 'CT Scanner',
    icon: '📡',
  },
  {
    key: 'equipment_xray',
    label: 'X-Ray',
    icon: '⚡',
  },
  {
    key: 'equipment_ventilator',
    label: 'Ventilator',
    icon: '💨',
  },
  {
    key: 'equipment_dialysis',
    label: 'Dialysis Machine',
    icon: '🩺',
  },
  {
    key: 'equipment_ecg',
    label: 'ECG Machine',
    icon: '📈',
  },
] as const;

type ResourceType = 'specialist' | 'equipment';

type AvailabilityStatus =
  | 'available'
  | 'limited'
  | 'unavailable'
  | 'unknown';

interface ResourceItem {
  key: string;
  label: string;
  icon: string;
}

const STATUS_OPTIONS: {
  value: AvailabilityStatus;
  label: string;
}[] = [
  {
    value: 'available',
    label: 'Available',
  },
  {
    value: 'limited',
    label: 'Limited',
  },
  {
    value: 'unavailable',
    label: 'Unavailable',
  },
  {
    value: 'unknown',
    label: 'Unknown',
  },
];

// --------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------

const isValidStatus = (
  value: unknown,
): value is AvailabilityStatus => {
  return STATUS_OPTIONS.some(
    (option) => option.value === value,
  );
};

const getResourceNotes = (
  key: string,
  notes: string | null | undefined,
): string => {
  if (!notes) {
    return '';
  }

  const prefix = `__key:${key}|`;

  if (notes.startsWith(prefix)) {
    return notes.slice(prefix.length);
  }

  if (notes === `__key:${key}`) {
    return '';
  }

  return '';
};

const matchesResource = (
  record: Availability,
  key: string,
  type: ResourceType,
): boolean => {
  if (record.availability_type !== type) {
    return false;
  }

  const notes = record.notes || '';

  return (
    notes.startsWith(`__key:${key}|`) ||
    notes === `__key:${key}`
  );
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export const SpecialistEquipment: React.FC = () => {
  const { user } = useAuthStore();

  const hospitalId = user?.hospital
    ? Number(user.hospital)
    : null;

  const validHospitalId =
    hospitalId !== null &&
    Number.isInteger(hospitalId) &&
    hospitalId > 0
      ? hospitalId
      : null;

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [records, setRecords] = useState<
    Availability[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [loadedHospitalId, setLoadedHospitalId] =
    useState<number | null>(null);

  const [editingKey, setEditingKey] = useState<
    string | null
  >(null);

  const [editStatus, setEditStatus] =
    useState<AvailabilityStatus>('unknown');

  const [editNotes, setEditNotes] = useState('');

  const [saving, setSaving] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // ------------------------------------------------
  // REFS
  // ------------------------------------------------

  const savingRef = useRef(false);

  const hospitalRef = useRef(validHospitalId);

  hospitalRef.current = validHospitalId;

  // ------------------------------------------------
  // LOAD AVAILABILITY RECORDS
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const fetchAvailability = async () => {
      setLoading(true);

      setError(null);

      setRecords([]);

      setLoadedHospitalId(null);

      setEditingKey(null);

      setEditNotes('');

      setEditStatus('unknown');

      if (validHospitalId === null) {
        setError(
          'No hospital is assigned to your account.',
        );

        setLoading(false);

        return;
      }

      try {
        const allRecords: Availability[] = [];

        const seenPages = new Set<string>();

        let page = 1;

        let hasNextPage = true;

        while (hasNextPage) {
          const response = await availabilityApi.list({
            hospital: validHospitalId,
            page,
            page_size: PAGE_SIZE,
          });

          if (cancelled) {
            return;
          }

          const data: unknown = response.data;

          let pageRecords: Availability[] = [];

          let nextPage = false;

          // API returns a direct array.

          if (Array.isArray(data)) {
            pageRecords = data as Availability[];
          }

          // Standard Django REST Framework pagination.

          else if (
            data !== null &&
            typeof data === 'object' &&
            'results' in data
          ) {
            const paginatedData = data as {
              results?: unknown;
              next?: unknown;
              count?: unknown;
            };

            if (
              !Array.isArray(
                paginatedData.results,
              )
            ) {
              throw new Error(
                'Invalid availability API response.',
              );
            }

            pageRecords =
              paginatedData.results as Availability[];

            if (
              typeof paginatedData.next ===
              'string'
            ) {
              nextPage =
                paginatedData.next.length > 0;
            } else if (
              paginatedData.next === undefined &&
              typeof paginatedData.count ===
                'number'
            ) {
              nextPage =
                allRecords.length +
                  pageRecords.length <
                paginatedData.count;
            }
          }

          // Unexpected response.

          else {
            throw new Error(
              'Unexpected availability API response format.',
            );
          }

          // Prevent an infinite loop if the backend
          // repeatedly returns the same page.

          const pageSignature = JSON.stringify(
            pageRecords.map((record) => record.id),
          );

          if (
            pageRecords.length > 0 &&
            seenPages.has(pageSignature)
          ) {
            throw new Error(
              'The availability API returned a repeated page. Check backend pagination.',
            );
          }

          if (pageRecords.length > 0) {
            seenPages.add(pageSignature);
          }

          allRecords.push(...pageRecords);

          if (
            pageRecords.length === 0 &&
            nextPage
          ) {
            throw new Error(
              'The availability API returned an empty page while indicating more results.',
            );
          }

          hasNextPage = nextPage;

          page += 1;
        }

        if (cancelled) {
          return;
        }

        // Only keep records belonging to the
        // currently selected hospital.

        const hospitalRecords = allRecords.filter(
          (record) => {
            if (
              record.hospital === null ||
              record.hospital === undefined
            ) {
              return true;
            }

            return (
              Number(record.hospital) ===
              validHospitalId
            );
          },
        );

        setRecords(hospitalRecords);

        setLoadedHospitalId(validHospitalId);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          'Failed to load specialist and equipment availability:',
          err,
        );

        setRecords([]);

        setError(
          'Unable to load specialist and equipment availability. Please try again.',
        );

        toast.error(
          'Failed to load availability information.',
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchAvailability();

    return () => {
      cancelled = true;
    };
  }, [validHospitalId, refreshKey]);

  // ------------------------------------------------
  // REFRESH
  // ------------------------------------------------

  const refreshAvailability = useCallback(() => {
    setRefreshKey((previous) => previous + 1);
  }, []);

  // ------------------------------------------------
  // FIND RESOURCE RECORD
  // ------------------------------------------------

  const getRecord = useCallback(
    (
      key: string,
      type: ResourceType,
    ): Availability | undefined => {
      const matchingRecords = records.filter(
        (record) =>
          matchesResource(record, key, type),
      );

      if (matchingRecords.length === 0) {
        return undefined;
      }

      // Prefer an active record if duplicates exist.
      // Otherwise, use the latest inactive record
      // so it can be updated instead of creating
      // another duplicate.

      const activeRecords = matchingRecords.filter(
        (record) => record.is_active !== false,
      );

      const candidates =
        activeRecords.length > 0
          ? activeRecords
          : matchingRecords;

      return candidates.reduce(
        (latest, current) =>
          current.id > latest.id
            ? current
            : latest,
      );
    },
    [records],
  );

  // ------------------------------------------------
  // RESOURCE RECORD LOOKUP
  // ------------------------------------------------

  const recordMap = useMemo(() => {
    const map = new Map<string, Availability>();

    const resources: {
      key: string;
      type: ResourceType;
    }[] = [
      ...SPECIALISTS.map((item) => ({
        key: item.key,
        type: 'specialist' as const,
      })),

      ...EQUIPMENT.map((item) => ({
        key: item.key,
        type: 'equipment' as const,
      })),
    ];

    for (const resource of resources) {
      const record = getRecord(
        resource.key,
        resource.type,
      );

      if (record) {
        map.set(resource.key, record);
      }
    }

    return map;
  }, [getRecord]);

  // ------------------------------------------------
  // START EDITING
  // ------------------------------------------------

  const startEdit = (
    key: string,
  ) => {
    if (
      savingRef.current ||
      loading ||
      validHospitalId === null
    ) {
      return;
    }

    const record = recordMap.get(key);

    const currentStatus =
      record?.is_active === false
        ? 'unknown'
        : record?.status;

    setEditStatus(
      isValidStatus(currentStatus)
        ? currentStatus
        : 'unknown',
    );

    setEditNotes(
      getResourceNotes(
        key,
        record?.notes,
      ),
    );

    setEditingKey(key);
  };

  // ------------------------------------------------
  // CANCEL EDITING
  // ------------------------------------------------

  const cancelEdit = () => {
    if (savingRef.current) {
      return;
    }

    setEditingKey(null);

    setEditStatus('unknown');

    setEditNotes('');
  };

  // ------------------------------------------------
  // SAVE RESOURCE AVAILABILITY
  // ------------------------------------------------

  const handleSave = async (
    key: string,
    type: ResourceType,
  ) => {
    if (savingRef.current) {
      return;
    }

    if (validHospitalId === null) {
      toast.error(
        'No hospital is assigned to your account.',
      );

      return;
    }

    if (!isValidStatus(editStatus)) {
      toast.error(
        'Please select a valid availability status.',
      );

      return;
    }

    if (editNotes.length > 500) {
      toast.error(
        'Notes cannot exceed 500 characters.',
      );

      return;
    }

    savingRef.current = true;

    setSaving(true);

    const currentHospitalId = validHospitalId;

    const record = recordMap.get(key);

    const cleanNotes = editNotes.trim();

    // Keep the resource key in the notes field
    // for compatibility with the existing backend
    // and previously saved records.

    const payload = {
      hospital: currentHospitalId,
      availability_type: type,
      status: editStatus,
      notes: `__key:${key}|${cleanNotes}`,
      is_active: true,
    };

    try {
      if (record) {
        // Update an existing resource record.

        await availabilityApi.update(
          record.id,
          payload as Parameters<
            typeof availabilityApi.update
          >[1],
        );
      } else {
        // Create a new resource record.

        await availabilityApi.create(
          payload as Parameters<
            typeof availabilityApi.create
          >[0],
        );
      }

      // Do not update the previous hospital's
      // editing state after switching hospitals.

      if (
        hospitalRef.current !== currentHospitalId
      ) {
        return;
      }

      toast.success(
        `${type === 'specialist' ? 'Specialist' : 'Equipment'} availability updated successfully.`,
      );

      setEditingKey(null);

      setEditStatus('unknown');

      setEditNotes('');

      refreshAvailability();
    } catch (err) {
      console.error(
        'Failed to save availability:',
        err,
      );

      if (
        hospitalRef.current === currentHospitalId
      ) {
        toast.error(
          'Failed to save availability. Please try again.',
        );
      }
    } finally {
      savingRef.current = false;

      setSaving(false);
    }
  };

  // ------------------------------------------------
  // RENDER RESOURCE CARD
  // ------------------------------------------------

  const renderItem = (
    item: ResourceItem,
    type: ResourceType,
  ) => {
    const record = recordMap.get(item.key);

    const activeRecord =
      record?.is_active === false
        ? undefined
        : record;

    const isEditing =
      editingKey === item.key;

    const isSaving =
      isEditing && saving;

    const notes = activeRecord
      ? getResourceNotes(
          item.key,
          activeRecord.notes,
        )
      : '';

    const currentStatus =
      activeRecord?.status || 'unknown';

    return (
      <div
        key={item.key}
        className={`card border-2 transition-all ${
          isEditing
            ? 'border-primary-300'
            : 'border-gray-100'
        }`}
      >
        {/* RESOURCE HEADER */}

        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xl"
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <span className="text-sm font-medium text-gray-800">
              {item.label}
            </span>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() =>
                startEdit(item.key)
              }
              disabled={
                saving ||
                loading ||
                validHospitalId === null
              }
              className="btn-secondary btn-sm text-xs disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Edit ${item.label} availability`}
              title={`Edit ${item.label}`}
            >
              <FiEdit2 />
            </button>
          )}
        </div>

        {/* DISPLAY MODE */}

        {!isEditing ? (
          <div>
            <StatusBadge
              status={currentStatus}
            />

            {notes && (
              <p className="mt-2 break-words text-xs text-gray-500">
                {notes}
              </p>
            )}

            {!activeRecord && (
              <p className="mt-1 text-xs italic text-gray-400">
                Not reported
              </p>
            )}
          </div>
        ) : (
          /* EDIT MODE */

          <div className="mt-3 space-y-3">
            {/* STATUS SELECT */}

            <div>
              <label
                htmlFor={`status-${item.key}`}
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Availability Status
              </label>

              <select
                id={`status-${item.key}`}
                className="input text-sm"
                value={editStatus}
                onChange={(event) => {
                  const value =
                    event.target.value;

                  if (isValidStatus(value)) {
                    setEditStatus(value);
                  }
                }}
                disabled={saving}
              >
                {STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* NOTES */}

            <div>
              <label
                htmlFor={`notes-${item.key}`}
                className="mb-1 block text-xs font-medium text-gray-600"
              >
                Notes (optional)
              </label>

              <textarea
                id={`notes-${item.key}`}
                className="input w-full text-sm"
                placeholder="Enter availability details..."
                value={editNotes}
                onChange={(event) =>
                  setEditNotes(
                    event.target.value,
                  )
                }
                maxLength={500}
                rows={3}
                disabled={saving}
              />

              <p className="mt-1 text-right text-xs text-gray-400">
                {editNotes.length}/500
              </p>
            </div>

            {/* ACTION BUTTONS */}

            <div className="flex gap-2">
              {/* SAVE */}

              <button
                type="button"
                onClick={() =>
                  void handleSave(
                    item.key,
                    type,
                  )
                }
                disabled={saving}
                className="btn-primary btn-sm flex flex-1 items-center justify-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <FiRefreshCw className="animate-spin" />

                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck />

                    Save
                  </>
                )}
              </button>

              {/* CANCEL */}

              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="btn-secondary btn-sm flex items-center gap-1 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FiX />

                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --------------------------------------------------
  // LOADING AND ERROR STATES
  // --------------------------------------------------

  if (loading || loadedHospitalId !== validHospitalId && !error) {
    return (
      <LoadingSpinner
        text="Loading specialists and equipment..."
      />
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="page-title">
          Specialists & Equipment
        </h1>

        <div className="card py-10 text-center">
          <p className="mb-4 text-sm text-red-600">
            {error}
          </p>

          {validHospitalId !== null && (
            <button
              type="button"
              onClick={refreshAvailability}
              className="btn-primary btn-sm"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN RENDER
  // --------------------------------------------------

  return (
    <div>
      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">
            Specialists & Equipment
          </h1>

          <p className="text-sm text-gray-500">
            Manage doctor availability and equipment status for{' '}
            <span className="font-medium">
              {user?.hospital_name ||
                'your hospital'}
            </span>
          </p>
        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={refreshAvailability}
          disabled={saving || loading}
          className="btn-secondary btn-sm flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            className={
              loading ? 'animate-spin' : ''
            }
          />

          Refresh
        </button>
      </div>

      {/* SPECIALISTS */}

      <div className="mb-8">
        <h2 className="section-title">
          Specialists / Doctors
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SPECIALISTS.map((specialist) =>
            renderItem(
              specialist,
              'specialist',
            ),
          )}
        </div>
      </div>

      {/* EQUIPMENT */}

      <div>
        <h2 className="section-title">
          Equipment Status
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EQUIPMENT.map((equipment) =>
            renderItem(
              equipment,
              'equipment',
            ),
          )}
        </div>
      </div>
    </div>
  );
};

export default SpecialistEquipment;