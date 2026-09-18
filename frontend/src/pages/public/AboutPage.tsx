import React from 'react';
import { Link } from 'react-router-dom';
import {
    FiSearch,
    FiActivity,
    FiShield,
    FiUsers,
    FiHeart,
    FiMapPin,
    FiArrowRight,
    FiCheckCircle,
} from 'react-icons/fi';

export const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f8f4eb]">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">

                {/* HERO */}
                <section className="relative overflow-hidden rounded-[30px] border border-[#dfd1b5] bg-gradient-to-br from-[#f9ead1] via-[#f5efe4] to-[#c8dcda] px-7 py-12 shadow-[0_18px_45px_rgba(78,58,26,0.10)] md:px-12 md:py-14">
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#0b6670]/10 blur-2xl" />
                    <div className="absolute -bottom-24 right-32 h-64 w-64 rounded-full bg-[#d6a94f]/10 blur-2xl" />

                    <div className="relative z-10 max-w-3xl">
                        <span className="inline-flex items-center rounded-full border border-[#d8c7a7] bg-white/60 px-4 py-2 text-xs font-semibold text-[#876a2e] backdrop-blur-sm">
                            About UpacharKhoj Nepal
                        </span>

                        <h1 className="mt-5 text-3xl font-bold leading-tight tracking-[-0.03em] text-[#172554] sm:text-4xl lg:text-5xl">
                            Helping patients find the
                            <span className="block text-[#08606a]">
                                right care before they travel.
                            </span>
                        </h1>

                        <p className="mt-5 max-w-2xl text-sm leading-6 text-[#4b5563] md:text-base">
                            UpacharKhoj Nepal is a healthcare availability and referral
                            platform designed to help patients and healthcare workers find
                            hospitals that report the services, beds, specialists and
                            resources they need.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#07545e] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#043f47]"
                            >
                                <FiSearch />
                                Find a Hospital
                                <FiArrowRight />
                            </Link>

                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 rounded-xl border border-[#d8cdb7] bg-white/70 px-5 py-3 text-sm font-semibold text-[#334155] transition hover:bg-white"
                            >
                                Get Started
                                <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* PURPOSE */}
                <section className="py-14">
                    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b18432]">
                                Our Purpose
                            </span>

                            <h2 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-[#172554] md:text-3xl">
                                Better information before patient transfer
                            </h2>

                            <p className="mt-5 text-sm leading-7 text-[#64748b]">
                                Patients are often referred from one facility to another
                                without knowing whether the receiving hospital currently has
                                the required service, specialist, bed or equipment.
                            </p>

                            <p className="mt-4 text-sm leading-7 text-[#64748b]">
                                UpacharKhoj Nepal brings reported hospital availability into
                                one place so healthcare workers and patients can make more
                                informed transfer decisions.
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-[#dfd4bf] bg-white p-6 shadow-[0_10px_30px_rgba(63,50,29,0.07)] md:p-8">
                            <div className="grid gap-4 sm:grid-cols-2">

                                <div className="rounded-2xl bg-[#f4f8f6] p-5">
                                    <FiSearch className="text-2xl text-[#08606a]" />

                                    <h3 className="mt-4 font-bold text-[#172554]">
                                        Search by service
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                        Find hospitals by treatment, department, bed availability
                                        or specialist requirement.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-[#faf6ed] p-5">
                                    <FiMapPin className="text-2xl text-[#b18432]" />

                                    <h3 className="mt-4 font-bold text-[#172554]">
                                        Search by location
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                        Narrow hospital results by district and identify suitable
                                        receiving facilities.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-[#faf6ed] p-5">
                                    <FiActivity className="text-2xl text-[#b18432]" />

                                    <h3 className="mt-4 font-bold text-[#172554]">
                                        Availability updates
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                        View hospital-reported availability information and
                                        freshness status.
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-[#f4f8f6] p-5">
                                    <FiHeart className="text-2xl text-[#08606a]" />

                                    <h3 className="mt-4 font-bold text-[#172554]">
                                        Safer referrals
                                    </h3>

                                    <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                        Support referral coordination before a patient begins
                                        their journey.
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                {/* WHO IT HELPS */}
                <section className="rounded-[28px] border border-[#ded4c0] bg-[#f2eadc] px-6 py-10 md:px-10">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b18432]">
                            Built For Healthcare Coordination
                        </span>

                        <h2 className="mt-3 text-2xl font-bold text-[#172554] md:text-3xl">
                            Who UpacharKhoj Nepal helps
                        </h2>

                        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
                            The platform connects public hospital information, healthcare
                            workers and hospital teams within one coordinated system.
                        </p>
                    </div>

                    <div className="mt-9 grid gap-5 md:grid-cols-3">

                        <div className="rounded-[20px] border border-white/70 bg-white/70 p-6 backdrop-blur-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1efec] text-xl text-[#08606a]">
                                <FiHeart />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-[#172554]">
                                Patients & Families
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                Search for hospitals offering the required treatment or service
                                before travelling long distances.
                            </p>
                        </div>

                        <div className="rounded-[20px] border border-white/70 bg-white/70 p-6 backdrop-blur-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7ead1] text-xl text-[#b18432]">
                                <FiUsers />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-[#172554]">
                                Healthcare Workers
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                Find suitable receiving hospitals and coordinate referrals
                                using reported availability information.
                            </p>
                        </div>

                        <div className="rounded-[20px] border border-white/70 bg-white/70 p-6 backdrop-blur-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e1efec] text-xl text-[#08606a]">
                                <FiActivity />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-[#172554]">
                                Hospitals
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                Maintain service and resource availability and respond to
                                incoming referral requests.
                            </p>
                        </div>

                    </div>
                </section>

                {/* TRUST */}
                <section className="py-14">
                    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">

                        <div className="rounded-[26px] border border-[#dce9e6] bg-[#edf6f3] p-7">
                            <FiShield className="text-3xl text-[#08606a]" />

                            <h2 className="mt-5 text-2xl font-bold text-[#172554]">
                                Information you can verify
                            </h2>

                            <p className="mt-3 text-sm leading-7 text-[#64748b]">
                                Availability information shown on UpacharKhoj Nepal is
                                reported by participating hospitals and may change as beds,
                                services and resources are used.
                            </p>

                            <div className="mt-5 space-y-3">

                                <div className="flex items-start gap-3">
                                    <FiCheckCircle className="mt-1 flex-shrink-0 text-[#0f8b77]" />

                                    <p className="text-sm text-[#475569]">
                                        Availability records include freshness information where
                                        available.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <FiCheckCircle className="mt-1 flex-shrink-0 text-[#0f8b77]" />

                                    <p className="text-sm text-[#475569]">
                                        Users are encouraged to confirm directly with the hospital
                                        before patient transfer.
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="lg:pl-6">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#b18432]">
                                Our Goal
                            </span>

                            <h2 className="mt-3 text-2xl font-bold leading-tight text-[#172554] md:text-3xl">
                                Reduce uncertainty during healthcare referrals
                            </h2>

                            <p className="mt-5 text-sm leading-7 text-[#64748b]">
                                Our goal is simple: help people know where appropriate care
                                may be available before they begin a transfer.
                            </p>

                            <p className="mt-4 text-sm leading-7 text-[#64748b]">
                                Better communication between referring facilities and
                                receiving hospitals can help reduce unnecessary travel and
                                make referral coordination more efficient.
                            </p>
                        </div>

                    </div>
                </section>

                {/* CTA */}
                <section className="overflow-hidden rounded-[28px] bg-[#07545e] px-6 py-10 text-center shadow-[0_14px_35px_rgba(7,84,94,0.18)] md:px-12">
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                        Ready to find the right hospital?
                    </h2>

                    <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/75">
                        Search hospitals by service and location and review their latest
                        reported availability.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 rounded-xl bg-[#f3d89e] px-5 py-3 text-sm font-bold text-[#16434a] transition hover:bg-[#f7e2b4]"
                        >
                            Find Hospital
                            <FiArrowRight />
                        </Link>

                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            Get Started
                            <FiArrowRight />
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
};