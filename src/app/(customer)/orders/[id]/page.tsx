import { redirect } from 'next/navigation';

export default function OrderDetailRedirectPage({ params }: { params: { id: string } }) {
  redirect('/profile/orders/' + params.id);
}
