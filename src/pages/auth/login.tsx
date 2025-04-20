import { LoginForm } from '@/components/auth/login-form';
import Header from '@/components/Header';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <h1>login</h1>
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <LoginForm />
      </main>
    </div>
  );
}
