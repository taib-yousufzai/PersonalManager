import SignInForm from './SignInForm'

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">
          Sign in
        </h1>
        <SignInForm />
      </div>
    </main>
  )
}
