import { redirect } from 'next/navigation';

export default function Home() {
  // Always start on the Login & Sign Up portal page
  redirect('/login');
}
