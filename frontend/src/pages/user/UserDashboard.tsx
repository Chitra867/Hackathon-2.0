
import React from 'react';
import { Link } from 'react-router-dom';

import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiHeart,
  FiHome,
  FiList,
  FiMapPin,
  FiNavigation,
  FiPlusCircle,
  FiSearch,
  FiShield,
  FiUser,
} from 'react-icons/fi';

import { GiHeartPlus } from 'react-icons/gi';

import { useAuthStore } from '../../store/authStore';

export const UserDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const firstName =
    user?.first_name ||
    user?.full_name?.split(' ')[0] ||
    user?.username ||
    'there';

  const quickActions = [
    {
      title: 'Find Hospitals',
      description:
        'Explore healthcare facilities and discover the services you need.',
      icon: <FiSearch />,
      to: '/user/hospitals',
      iconBg: 'bg-[#e2f5f0]',
      iconColor: 'text-[#08786e]',
      hoverBorder: 'hover:border-[#a9dcd0]',
      label: 'Explore hospitals',
    },
    {
      title: 'Hospital Map',
      description:
        'Find hospital locations and explore healthcare options on the map.',
      icon: <FiMapPin />,
      to: '/user/map',
      iconBg: 'bg-[#eeebff]',
      iconColor: 'text-[#7463be]',
      hoverBorder: 'hover:border-[#d1c9f5]',
      label: 'View locations',
    },
    {
      title: 'Request Help',
      description:
        'Send a request to a hospital and get assistance with your care.',
      icon: <FiPlusCircle />,
      to: '/user/request-help',
      iconBg: 'bg-[#fff0df]',
      iconColor: 'text-[#cd8141]',
      hoverBorder: 'hover:border-[#f2d6b1]',
      label: 'Get assistance',
    },
    {
      title: 'My Requests',
      description:
        'Keep track of your healthcare requests and hospital responses.',
      icon: <FiList />,
      to: '/user/referrals',
      iconBg: 'bg-[#e6efff]',
      iconColor: 'text-[#477ac1]',
      hoverBorder: 'hover:border-[#bdd4f5]',
      label: 'Track requests',
    },
  ];

  const careSteps = [
    {
      number: '01',
      title: 'Find your hospital',
      description:
        'Search hospitals and explore the available healthcare services.',
      icon: <FiSearch />,
      to: '/user/hospitals',
      color: 'bg-[#e3f3ee] text-[#0e7775]',
    },
    {
      number: '02',
      title: 'Request assistance',
      description:
        'Send a healthcare assistance request to your chosen hospital.',
      icon: <FiHeart />,
      to: '/user/request-help',
      color: 'bg-[#fff1de] text-[#be8550]',
    },
    {
      number: '03',
      title: 'Track your progress',
      description:
        'Stay updated on your requests and hospital responses.',
      icon: <FiCheckCircle />,
      to: '/user/referrals',
      color: 'bg-[#eeeaff] text-[#7463be]',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#faf8f3]">

      <div className="mx-auto max-w-[1500px] space-y-8 px-4 py-6 pb-28 sm:px-6 md:px-8 md:py-8 md:pb-12 lg:px-10">

        {/* WELCOME HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2caa88]" />

              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#82938e]">
                Your Healthcare Space
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#173c40] sm:text-3xl">
              Hello, {firstName}! 👋
            </h1>

            <p className="mt-2 text-sm text-[#7c8d89]">
              Welcome back! Your healthcare journey starts here.
            </p>

          </div>

          <Link
            to="/user/profile"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#e4e9e4] bg-white px-4 py-2.5 text-sm font-medium text-[#41615e] shadow-sm transition-all hover:border-[#b8d6ce] hover:text-[#0e6068]"
          >
            <FiUser className="text-base" />
            My Profile
            <FiChevronRight />
          </Link>

        </div>

        {/* HERO SECTION */}

        <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#126c73] via-[#0d5860] to-[#113d47] shadow-[0_15px_40px_rgba(15,78,83,0.16)]">

          {/* DECORATIVE BACKGROUND */}

          <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border-[45px] border-white/5" />

          <div className="pointer-events-none absolute right-20 top-24 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-[#6fc5b1]/10 blur-3xl" />

          <div className="relative z-10 grid items-center gap-8 p-6 sm:p-9 lg:grid-cols-[1.3fr_0.7fr] lg:p-12">

            {/* HERO CONTENT */}

            <div>

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-[#d6f3ed]">
                <FiHeart className="text-[#a8e9d0]" />
                Your health, our priority
              </div>

              <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[44px]">
                Better healthcare
                <br />
                starts with
                <span className="text-[#a9e6cc]">
                  {' '}better access.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#d4e8e4] sm:text-base">
                Find hospitals, explore available services,
                request assistance, and stay connected to
                the care you need — all in one place.
              </p>

              {/* CTA BUTTONS */}

              <div className="mt-8 flex flex-wrap gap-3">

                <Link
                  to="/user/hospitals"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f3dba8] px-6 py-3.5 text-sm font-semibold text-[#24464a] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#f8e5bf]"
                >
                  <FiSearch />
                  Find Hospitals
                  <FiArrowRight />
                </Link>

                <Link
                  to="/user/request-help"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20"
                >
                  Request Help
                </Link>

              </div>

              {/* HERO BOTTOM FEATURES */}

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">

                <div className="flex items-center gap-2 text-xs text-[#d2e8e2]">
                  <FiCheckCircle className="text-[#a9e6cc]" />
                  Explore hospitals
                </div>

                <div className="flex items-center gap-2 text-xs text-[#d2e8e2]">
                  <FiCheckCircle className="text-[#a9e6cc]" />
                  Request assistance
                </div>

                <div className="flex items-center gap-2 text-xs text-[#d2e8e2]">
                  <FiCheckCircle className="text-[#a9e6cc]" />
                  Track your care
                </div>

              </div>

            </div>

            {/* HERO MEDICAL ILLUSTRATION */}

            <div className="relative hidden min-h-[300px] items-center justify-center lg:flex">

              {/* OUTER CIRCLES */}

              <div className="absolute h-[280px] w-[280px] rounded-full border border-white/15" />

              <div className="absolute h-[230px] w-[230px] rounded-full border border-white/15 bg-white/5" />

              <div className="absolute h-[180px] w-[180px] rounded-full border border-white/15 bg-white/5" />

              {/* CENTER ICON */}

              <div className="relative z-10 flex h-36 w-36 items-center justify-center rounded-[40px] border border-white/20 bg-white/15 shadow-2xl backdrop-blur-md">

                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-xl">

                  <GiHeartPlus className="text-6xl text-[#0e7775]" />

                </div>

              </div>

              {/* FLOATING ICON 1 */}

              <div className="absolute left-0 top-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/20 text-2xl text-white shadow-lg backdrop-blur-md">
                <FiHeart />
              </div>

              {/* FLOATING ICON 2 */}

              <div className="absolute bottom-5 left-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/20 text-xl text-white shadow-lg backdrop-blur-md">
                <FiActivity />
              </div>

              {/* FLOATING ICON 3 */}

              <div className="absolute right-1 top-16 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/20 text-2xl text-white shadow-lg backdrop-blur-md">
                <FiShield />
              </div>

              {/* FLOATING INFO CARD */}

              <div className="absolute bottom-7 right-0 rounded-xl border border-white/20 bg-white/15 px-4 py-3 shadow-xl backdrop-blur-md">

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#a9e6cc] text-[#155b5c]">
                    <FiCheckCircle />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      Find the right care
                    </p>

                    <p className="text-[10px] text-[#c5e5db]">
                      Your healthcare companion
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* QUICK ACCESS SECTION */}

        <section>

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">

            <div>

              <div className="mb-2 flex items-center gap-2">
                <span className="h-1 w-5 rounded-full bg-[#0e7775]" />

                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#0e7775]">
                  Quick Access
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#173c40] sm:text-2xl">
                What would you like to do?
              </h2>

              <p className="mt-1.5 text-sm text-[#88958f]">
                Everything you need, just a click away.
              </p>

            </div>

            <Link
              to="/user/hospitals"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0e7775] transition-colors hover:text-[#094e52]"
            >
              Explore hospitals
              <FiArrowRight />
            </Link>

          </div>

          {/* QUICK ACTION CARDS */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {quickActions.map((action) => (

              <Link
                key={action.title}
                to={action.to}
                className={`group flex min-h-[230px] flex-col rounded-2xl border border-[#eeeae1] bg-white p-5 shadow-[0_3px_15px_rgba(30,65,60,0.03)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(30,65,60,0.10)] ${action.hoverBorder}`}
              >

                {/* CARD ICON */}

                <div className="flex items-start justify-between">

                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${action.iconBg} ${action.iconColor}`}
                  >
                    {action.icon}
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f7f3] text-[#a2afaa] transition-all group-hover:bg-[#0e6068] group-hover:text-white">
                    <FiArrowRight className="transition-transform group-hover:-rotate-45" />
                  </span>

                </div>

                {/* CARD CONTENT */}

                <h3 className="mt-5 text-base font-bold text-[#193e40]">
                  {action.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-[#88958f]">
                  {action.description}
                </p>

                {/* CARD FOOTER */}

                <div className="mt-5 border-t border-[#f0f1ec] pt-3">

                  <span className="text-xs font-semibold text-[#0e7775]">
                    {action.label}
                  </span>

                </div>

              </Link>

            ))}

          </div>

        </section>

        {/* EMERGENCY + HEALTHCARE JOURNEY */}

        <section className="grid gap-5 xl:grid-cols-[1fr_1.35fr]">

          {/* EMERGENCY CARD */}

          <div className="relative overflow-hidden rounded-[24px] border border-[#f2d9ce] bg-gradient-to-br from-[#fff3ea] to-[#ffebe4] p-6 sm:p-7">

            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border-[25px] border-[#eb9b79]/10" />

            <div className="relative z-10">

              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fce0d3] text-2xl text-[#cc6549]">
                <FiAlertTriangle />
              </div>

              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#c67252]">
                Emergency Assistance
              </span>

              <h3 className="mt-2 text-xl font-bold text-[#693d31]">
                Need urgent medical care?
              </h3>

              <p className="mt-3 max-w-sm text-sm leading-6 text-[#8e6e60]">
                Quickly explore hospitals and emergency care
                options when you need medical assistance.
              </p>

              <Link
                to="/user/emergency"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#b95f47] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#9e4c39]"
              >
                <FiAlertTriangle />
                Find Emergency Care
                <FiArrowRight />
              </Link>

              <p className="mt-4 text-xs leading-5 text-[#9a7568]">
                For an immediate medical emergency,
                contact local emergency services directly.
              </p>

            </div>

          </div>

          {/* HEALTHCARE JOURNEY CARD */}

          <div className="rounded-[24px] border border-[#eeeae1] bg-white p-6 shadow-sm sm:p-7">

            <div className="mb-6 flex items-start justify-between gap-3">

              <div>

                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#0e7775]">
                  Your Care Journey
                </span>

                <h3 className="mt-2 text-xl font-bold text-[#193e40]">
                  Healthcare, made simple.
                </h3>

                <p className="mt-2 text-sm text-[#88958f]">
                  Three simple ways to get started.
                </p>

              </div>

              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#e9f5f0] text-xl text-[#0e7775]">
                <FiHeart />
              </div>

            </div>

            {/* JOURNEY STEPS */}

            <div className="space-y-2">

              {careSteps.map((step) => (

                <Link
                  key={step.number}
                  to={step.to}
                  className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-[#f5f9f6]"
                >

                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step.color}`}
                  >
                    {step.number}
                  </div>

                  <div className="min-w-0 flex-1">

                    <h4 className="text-sm font-semibold text-[#214347]">
                      {step.title}
                    </h4>

                    <p className="mt-1 text-xs leading-5 text-[#8c9a94]">
                      {step.description}
                    </p>

                  </div>

                  <FiChevronRight className="flex-shrink-0 text-[#a4b7af] transition-transform group-hover:translate-x-1" />

                </Link>

              ))}

            </div>

          </div>

        </section>

        {/* ADDITIONAL SHORTCUTS */}

        <section className="grid gap-4 sm:grid-cols-2">

          {/* REFERRAL SHORTCUT */}

          <Link
            to="/user/new-referral"
            className="group flex items-center gap-4 rounded-2xl border border-[#e4eae2] bg-[#eef5ef] p-5 transition-all hover:border-[#bfd7c9] hover:shadow-md"
          >

            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xl text-[#41846c] shadow-sm">
              <FiNavigation />
            </div>

            <div className="min-w-0 flex-1">

              <h3 className="font-semibold text-[#214347]">
                Refer to Another Hospital
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#789187]">
                Explore hospital referral options.
              </p>

            </div>

            <FiArrowRight className="flex-shrink-0 text-[#41846c] transition-transform group-hover:translate-x-1" />

          </Link>

          {/* REQUEST HISTORY SHORTCUT */}

          <Link
            to="/user/referrals"
            className="group flex items-center gap-4 rounded-2xl border border-[#e7e7f0] bg-[#f1f0f9] p-5 transition-all hover:border-[#d3cdec] hover:shadow-md"
          >

            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xl text-[#7565a6] shadow-sm">
              <FiClock />
            </div>

            <div className="min-w-0 flex-1">

              <h3 className="font-semibold text-[#363c58]">
                Your Request History
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#8787a3]">
                View previous requests and their status.
              </p>

            </div>

            <FiArrowRight className="flex-shrink-0 text-[#7565a6] transition-transform group-hover:translate-x-1" />

          </Link>

        </section>

        {/* DASHBOARD FOOTER */}

        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eae8df] pt-6 text-xs text-[#9aaba2] sm:flex-row">

          <div className="flex items-center gap-2">

            <FiHeart className="text-[#0e7775]" />

            <span>
              UpacharKhoj — Healthcare made easier.
            </span>

          </div>

          <Link
            to="/user/dashboard"
            className="flex items-center gap-1 hover:text-[#0e7775]"
          >
            <FiHome />
            Your health matters.
          </Link>

        </div>

      </div>

    </div>
  );
};