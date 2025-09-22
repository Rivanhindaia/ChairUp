'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../../lib/supabaseClient'
export default function SignIn(){
  return (<div className="max-w-md mx-auto card"><h2 className="text-2xl font-bold mb-4">Sign in to Chair<span className="text-sky-500">Up</span></h2><Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} theme="light" providers={[]} /></div>)
}
