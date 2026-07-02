import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleAuthButton({ onError }) {
  const { loginWithGoogle } = useAuth();

  if (!googleClientId) return null;

  return (
    <div className="my-4 flex flex-col items-center gap-4">
      <div className="flex w-full items-center gap-3 text-xs font-medium uppercase text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        or
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          try {
            await loginWithGoogle(credentialResponse.credential);
          } catch (err) {
            onError?.(err.response?.data?.error || "Google sign-in failed. Please try again.");
          }
        }}
        onError={() => onError?.("Google sign-in failed. Please try again.")}
        width="100%"
      />
    </div>
  );
}
