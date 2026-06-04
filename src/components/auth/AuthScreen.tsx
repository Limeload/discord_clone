import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';

// Deterministic star positions — avoids hydration issues and re-render churn
const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  top: `${(i * 11.3 + 3.7) % 97}%`,
  left: `${(i * 17.1 + 8.3) % 96}%`,
  size: i % 15 === 0 ? 3 : i % 5 === 0 ? 2 : 1,
  delay: `${(i * 0.4) % 5}s`,
  duration: `${2.5 + (i % 4) * 0.7}s`,
}));

const ACCENT_DOTS = ['#5865f2', '#eb459e', '#00b0f4', '#fee75c', '#23a55a'];

const clerkAppearance = {
  variables: {
    colorBackground: 'transparent',
    colorInputBackground: 'rgba(255,255,255,0.06)',
    colorInputText: '#e2e5f0',
    colorText: '#e2e5f0',
    colorTextSecondary: '#8b94b8',
    colorTextOnPrimaryBackground: '#ffffff',
    colorPrimary: '#5865f2',
    colorDanger: '#f87171',
    colorSuccess: '#23a55a',
    colorNeutral: '#8b94b8',
    borderRadius: '8px',
    fontFamily: '"gg sans", "Noto Sans", Whitney, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
    fontWeight: { normal: 400, medium: 500, bold: 700 },
    fontSize: '14px',
    spacingUnit: '16px',
  },
  elements: {
    card: 'shadow-none bg-transparent p-0 !overflow-visible',
    rootBox: 'w-full',
    cardBox: '!overflow-visible',
    headerTitle: 'text-white text-2xl font-bold',
    headerSubtitle: 'text-[#8b94b8] text-sm',
    socialButtonsBlockButton:
      'bg-white/5 border border-white/10 hover:bg-white/10 text-[#e2e5f0] font-medium transition-colors',
    socialButtonsBlockButtonText: 'text-[#e2e5f0] font-medium',
    dividerLine: 'bg-white/10',
    dividerText: 'text-[#8b94b8] text-xs uppercase tracking-wide',
    formFieldLabel: 'text-[#8b94b8] text-xs font-bold uppercase tracking-wide',
    formFieldInput:
      'bg-white/5 text-[#e2e5f0] border-white/10 focus:border-[#5865f2] rounded-lg placeholder-[#555e7a]',
    formFieldInputShowPasswordButton: 'text-[#8b94b8] hover:text-[#e2e5f0]',
    formFieldErrorText: 'text-[#f87171]',
    formButtonPrimary:
      'bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium transition-colors rounded-lg',
    footerAction: 'hidden',
    footerActionLink: 'hidden',
    footerActionText: 'hidden',
    footer: 'bg-transparent border-t border-white/10',
    main: 'bg-transparent !overflow-visible',
    identityPreviewText: 'text-[#e2e5f0]',
    identityPreviewEditButton: 'text-[#5865f2]',
    alertText: 'text-[#f87171]',
    backLink: 'text-[#5865f2] hover:underline',
  },
};

type View = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const [view, setView] = useState<View>('sign-in');

  return (
    <div
      className="h-screen w-screen overflow-hidden relative flex"
      style={{ background: '#05060f' }}
    >
      {/* Aurora background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-15%',
            width: '60vw',
            height: '60vw',
            maxWidth: 700,
            maxHeight: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #5865f2, transparent 65%)',
            filter: 'blur(80px)',
            opacity: 0.38,
            animation: 'auth-blob 18s ease-in-out infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-15%',
            width: '55vw',
            height: '55vw',
            maxWidth: 650,
            maxHeight: 650,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 65% 65%, #eb459e, transparent 65%)',
            filter: 'blur(80px)',
            opacity: 0.3,
            animation: 'auth-blob 22s ease-in-out infinite reverse',
            animationDelay: '-8s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '15%',
            right: '8%',
            width: '30vw',
            height: '30vw',
            maxWidth: 400,
            maxHeight: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 55% 40%, #00b0f4, transparent 65%)',
            filter: 'blur(60px)',
            opacity: 0.2,
            animation: 'auth-blob 25s ease-in-out infinite',
            animationDelay: '-4s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '5%',
            left: '5%',
            width: '35vw',
            height: '35vw',
            maxWidth: 450,
            maxHeight: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 40% 55%, #7c3aed, transparent 65%)',
            filter: 'blur(70px)',
            opacity: 0.22,
            animation: 'auth-blob 20s ease-in-out infinite reverse',
            animationDelay: '-12s',
          }}
        />
      </div>

      {/* Twinkling stars */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animation: `twinkle ${star.duration} ease-in-out infinite`,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Left panel — desktop branding */}
      <div className="hidden lg:flex flex-col items-center justify-center flex-1 relative z-10 px-16 select-none">
        {/* Glowing floating Discord logo */}
        <div style={{ animation: 'float-up 6s ease-in-out infinite' }}>
          <svg
            width="96"
            height="72"
            viewBox="0 -28.5 256 256"
            className="mb-8"
            style={{ filter: 'drop-shadow(0 0 32px rgba(88,101,242,0.9))' }}
          >
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7289da" />
                <stop offset="55%" stopColor="#5865f2" />
                <stop offset="100%" stopColor="#eb459e" />
              </linearGradient>
            </defs>
            <path
              fill="url(#logo-grad)"
              d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.6290784,82.7145587 85.4738752,82.7145587 C98.3186720,82.7145587 108.688526,94.5189427 108.488414,108.914901 C108.508323,123.290155 98.3186720,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.880390,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.680441,82.7145587 170.525237,82.7145587 C183.370033,82.7145587 193.739887,94.5189427 193.539775,108.914901 C193.539775,123.290155 183.370033,135.09489 170.525237,135.09489 Z"
            />
          </svg>
        </div>

        {/* Animated gradient headline */}
        <h1
          className="text-5xl font-bold text-center leading-tight mb-4"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #c9d3ff 45%, #eb459e 100%)',
            backgroundSize: '200% 200%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient-shift 7s ease infinite',
          }}
        >
          Where communities<br />come alive
        </h1>

        <p className="text-[#8b94b8] text-center max-w-xs mt-3 leading-relaxed text-sm">
          Connect with friends, build communities, and stay close with the people that matter most.
        </p>

        {/* Decorative color dots */}
        <div className="flex gap-4 mt-10">
          {ACCENT_DOTS.map((color, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 9,
                height: 9,
                background: color,
                boxShadow: `0 0 12px ${color}, 0 0 4px ${color}`,
                animation: `twinkle ${1.6 + i * 0.35}s ease-in-out infinite`,
                animationDelay: `${i * 0.28}s`,
              }}
            />
          ))}
        </div>

        {/* Subtle dot grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Right panel — auth form */}
      <div className="flex flex-col items-center justify-center w-full lg:w-[500px] relative z-10 px-5 py-8 overflow-y-auto">
        <div
          className="w-full max-w-md rounded-2xl px-8 pt-8 pb-4"
          style={{
            background: 'rgba(8, 9, 18, 0.78)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1px solid rgba(88, 101, 242, 0.22)',
            boxShadow:
              '0 30px 70px rgba(0,0,0,0.6), 0 0 50px rgba(88,101,242,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* Logo shown on mobile / small screens */}
          <div className="flex flex-col items-center mb-5 lg:hidden">
            <svg
              width="40"
              height="30"
              viewBox="0 -28.5 256 256"
              fill="#5865f2"
              style={{ filter: 'drop-shadow(0 0 10px rgba(88,101,242,0.7))' }}
            >
              <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.6290784,82.7145587 85.4738752,82.7145587 C98.3186720,82.7145587 108.688526,94.5189427 108.488414,108.914901 C108.508323,123.290155 98.3186720,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.880390,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.680441,82.7145587 170.525237,82.7145587 C183.370033,82.7145587 193.739887,94.5189427 193.539775,108.914901 C193.539775,123.290155 183.370033,135.09489 170.525237,135.09489 Z" />
            </svg>
          </div>

          {/* Clerk sign-in / sign-up */}
          {view === 'sign-in' ? (
            <SignIn appearance={clerkAppearance} signUpUrl="#" afterSignInUrl="/" />
          ) : (
            <SignUp appearance={clerkAppearance} signInUrl="#" afterSignUpUrl="/" />
          )}

          {/* Toggle */}
          <div className="text-center py-4 text-sm" style={{ color: '#555e7a' }}>
            {view === 'sign-in' ? (
              <>
                Need an account?{' '}
                <button
                  onClick={() => setView('sign-up')}
                  className="text-[#7289da] hover:text-[#5865f2] font-medium transition-colors hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setView('sign-in')}
                  className="text-[#7289da] hover:text-[#5865f2] font-medium transition-colors hover:underline"
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
