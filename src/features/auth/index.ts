// Public API for the auth feature.
// All other parts of the app must import from here, not from subdirectories directly.
export { authService } from './application/auth-service'
export type { User, UserRole, SignInInput, SignUpInput } from './domain/types'
export { signInSchema, signUpSchema } from './domain/types'
