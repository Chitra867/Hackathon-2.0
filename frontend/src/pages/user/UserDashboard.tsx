import React from 'react';
import { Link } from 'react-router-dom';
import {
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
  FiUser,
} from 'react-icons/fi';
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
      description: 'Explore healthcare facilities and discover the services you need.',
      icon: <FiSearch />,
      to: '/user/hospitals',
      iconBg: 'bg-[#e2f5f0]',
      iconColor: 'text-[#08786e]',
      hoverBorder: 'hover:border-[#a9dcd0]',
      label: 'Explore hospitals',
    },
    {
      title: 'Hospital Map',
      description: 'Find hospital locations and explore healthcare options on the map.',
      icon: <FiMapPin />,
      to: '/user/map',
      iconBg: 'bg-[#eeebff]',
      iconColor: 'text-[#7463be]',
      hoverBorder: 'hover:border-[#d1c9f5]',
      label: 'View locations',
    },
    {
      title: 'Request Help',
      description: 'Send a request to a hospital and get assistance with your care.',
      icon: <FiPlusCircle />,
      to: '/user/request-help',
      iconBg: 'bg-[#fff0df]',
      iconColor: 'text-[#cd8141]',
      hoverBorder: 'hover:border-[#f2d6b1]',
      label: 'Get assistance',
    },
    {
      title: 'My Requests',
      description: 'Keep track of your healthcare requests and hospital responses.',
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
      description: 'Search hospitals and explore the available healthcare services.',
      icon: <FiSearch />,
      to: '/user/hospitals',
      color: 'bg-[#e3f3ee] text-[#0e7775]',
    },
    {
      number: '02',
      title: 'Request assistance',
      description: 'Send a healthcare assistance request to your chosen hospital.',
      icon: <FiHeart />,
      to: '/user/request-help',
      color: 'bg-[#fff1de] text-[#be8550]',
    },
    {
      number: '03',
      title: 'Track your progress',
      description: 'Stay updated on your requests and hospital responses.',
      icon: <FiCheckCircle />,
      to: '/user/referrals',
      color: 'bg-[#eeeaff] text-[#7463be]',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#faf8f3]">
      <div className="mx-auto max-w-[1500px] space-y-8 px-4 py-6 pb-28 sm:px-6 md:px-8 md:py-8 md:pb-12 lg:px-10">

        {/* COMPACT HERO BANNER */}

        <section className="relative isolate overflow-hidden rounded-[24px] bg-gradient-to-r from-[#126c73] via-[#0d5860] to-[#113d47] px-6 py-6 shadow-[0_10px_25px_rgba(15,78,83,0.12)] sm:px-8 sm:py-7">

          <div className="pointer-events-none absolute -right-14 -top-24 h-52 w-52 rounded-full border-[28px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-24 right-24 h-40 w-40 rounded-full bg-[#6fc5b1]/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#a9e6cc]" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bfe7dd]">
                  Your Healthcare Space
                </span>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Hello, {firstName}! 👋
              </h1>

              <p className="mt-1.5 text-sm text-[#d4e8e4]">
                Welcome back! Your healthcare journey starts here.
              </p>
            </div>

            <Link
              to="/user/profile"
              className="inline-flex w-fit flex-shrink-0 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/20"
            >
              <FiUser className="text-base" />
              My Profile
              <FiChevronRight />
            </Link>

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
                <div className="flex items-start justify-between">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${action.iconBg} ${action.iconColor}`}>
                    {action.icon}
                  </div>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f7f3] text-[#a2afaa] transition-all group-hover:bg-[#0e6068] group-hover:text-white">
                    <FiArrowRight className="transition-transform group-hover:-rotate-45" />
                  </span>
                </div>

                <h3 className="mt-5 text-base font-bold text-[#193e40]">
                  {action.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-6 text-[#88958f]">
                  {action.description}
                </p>

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
                Quickly explore hospitals and emergency care options when you need medical assistance.
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
                For an immediate medical emergency, contact local emergency services directly.
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

            <div className="space-y-2">
              {careSteps.map((step) => (
                <Link
                  key={step.number}
                  to={step.to}
                  className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-[#f5f9f6]"
                >
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold ${step.color}`}>
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
            <span>UpacharKhoj — Healthcare made easier.</span>
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