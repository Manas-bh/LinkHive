import LoginClient from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const callbackParam = params.callbackUrl;
  const callbackUrl = Array.isArray(callbackParam)
    ? callbackParam[0]
    : callbackParam || "/dashboard";

  return <LoginClient callbackUrl={callbackUrl} />;
}
