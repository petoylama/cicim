import { redirect } from 'next/navigation';

export default function BlogDetailRedirect() {
  redirect('/dashboard');
}
