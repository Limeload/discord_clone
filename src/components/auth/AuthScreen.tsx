import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';

const clerkAppearance = {
  variables: {
    colorBackground: '#313338',
    colorInputBackground: '#1e1f22',
    colorInputText: '#dbdee1',
    colorText: '#dbdee1',
    colorTextSecondary: '#b5bac1',
    colorTextOnPrimaryBackground: '#ffffff',
    colorPrimary: '#5865f2',
    colorDanger: '#f87171',
    colorSuccess: '#23a55a',
    colorNeutral: '#b5bac1',
    borderRadius: '4px',
    fontFamily: '"gg sans", "Noto Sans", Whitney, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
    fontWeight: { normal: 400, medium: 500, bold: 700 },
    fontSize: '14px',
    spacingUnit: '16px',
  },
  elements: {
    // Remove Clerk's outer card shadow/border — we provide our own card
    card: 'shadow-none bg-transparent p-0 !overflow-visible',
    rootBox: 'w-full',
    cardBox: '!overflow-visible',
    // Header
    headerTitle: 'text-white text-2xl font-bold',
    headerSubtitle: 'text-[#b5bac1] text-sm',
    // Social buttons
    socialButtonsBlockButton:
      'bg-[#1e1f22] border border-[#1e1f22] hover:bg-[#2b2d31] text-[#dbdee1] font-medium transition-colors',
    socialButtonsBlockButtonText: 'text-[#dbdee1] font-medium',
    // Divider
    dividerLine: 'bg-[#3f4147]',
    dividerText: 'text-[#87898c] text-xs uppercase tracking-wide',
    // Form labels
    formFieldLabel: 'text-[#b5bac1] text-xs font-bold uppercase tracking-wide',
    formFieldInput:
      'bg-[#1e1f22] text-[#dbdee1] border-[#1e1f22] focus:border-[#5865f2] rounded placeholder-[#87898c]',
    formFieldInputShowPasswordButton: 'text-[#87898c] hover:text-[#dbdee1]',
    // Error
    formFieldErrorText: 'text-[#f87171]',
    // Primary button
    formButtonPrimary:
      'bg-[#5865f2] hover:bg-[#4752c4] text-white font-medium transition-colors rounded',
    // Footer links — hide Clerk's built-in sign-up link; we render our own toggle below
    footerAction: 'hidden',
    footerActionLink: 'hidden',
    footerActionText: 'hidden',
    footer: 'bg-transparent border-t border-[#3f4147]',
    main: 'bg-transparent !overflow-visible',
    // Identity preview (after signing in step)
    identityPreviewText: 'text-[#dbdee1]',
    identityPreviewEditButton: 'text-[#00a8fc]',
    // Alert
    alertText: 'text-[#f87171]',
    // Back button
    backLink: 'text-[#00a8fc] hover:underline',
  },
};

type View = 'sign-in' | 'sign-up';

export function AuthScreen() {
  const [view, setView] = useState<View>('sign-in');

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-start overflow-x-hidden overflow-y-auto relative bg-[#313338] py-8">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #5865f2, transparent)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
          style={{ background: 'radial-gradient(circle, #eb459e, transparent)' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #fee75c, transparent)' }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md bg-[#313338] rounded-xl shadow-2xl px-8 pt-8 pb-4">
        {/* Discord logo + wordmark */}
        <div className="flex flex-col items-center mb-6">
          <svg width="40" height="30" viewBox="0 -28.5 256 256" fill="#5865f2" className="mb-3">
            <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.6290784,82.7145587 85.4738752,82.7145587 C98.3186720,82.7145587 108.688526,94.5189427 108.488414,108.914901 C108.508323,123.290155 98.3186720,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.880390,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.680441,82.7145587 170.525237,82.7145587 C183.370033,82.7145587 193.739887,94.5189427 193.539775,108.914901 C193.539775,123.290155 183.370033,135.09489 170.525237,135.09489 Z" />
          </svg>
        </div>

        {/* Clerk component — full social login + email/password */}
        {view === 'sign-in' ? (
          <SignIn
            appearance={clerkAppearance}
            signUpUrl="#"
            afterSignInUrl="/"
          />
        ) : (
          <SignUp
            appearance={clerkAppearance}
            signInUrl="#"
            afterSignUpUrl="/"
          />
        )}

        {/* Toggle between sign-in / sign-up */}
        <div className="text-center py-4 text-sm text-[#87898c]">
          {view === 'sign-in' ? (
            <>
              Need an account?{' '}
              <button
                onClick={() => setView('sign-up')}
                className="text-[#00a8fc] hover:underline font-medium"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setView('sign-in')}
                className="text-[#00a8fc] hover:underline font-medium"
              >
                Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
