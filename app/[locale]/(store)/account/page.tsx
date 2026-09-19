import { redirect } from '@/i18n/navigation';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/account/orders', locale });
}
