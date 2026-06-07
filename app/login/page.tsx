"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Github, Mail } from "lucide-react"

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof authSchema>>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof authSchema>) {
    setIsLoading(true)
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        toast.success("Check your email to confirm your account!")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        })
        if (error) throw error
        toast.success("Welcome back!")
        router.push("/browse")
        router.refresh()
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: "github" | "google") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with OAuth")
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0071eb]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0071eb]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex flex-col items-center gap-2">
            <div className="bg-zinc-900/50 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
              <Image
                src="/image.png"
                alt="Agasobanuye Movies Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
              Agasobanuye<span className="text-[#0071eb]">Movies</span>
            </h1>
          </Link>
        </div>

        <Card className="bg-zinc-900/40 backdrop-blur-2xl border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <CardTitle className="text-3xl font-black text-white uppercase tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-zinc-400 font-medium">
              {isSignUp 
                ? "Join the ultimate Agasobanuye community today" 
                : "Sign in to access your watchlist and favorites"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 px-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control= {form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="name@example.com" 
                          {...field} 
                          className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-[#0071eb] transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-12 bg-white/5 border-white/10 rounded-2xl focus:border-[#0071eb] transition-all"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#0071eb] hover:bg-[#0071eb]/90 text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_0_20px_rgba(0,113,235,0.3)] transition-all active:scale-95 disabled:opacity-70"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isSignUp ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/5" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
                <span className="bg-transparent px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-12 bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 hover:text-white transition-all font-bold"
                onClick={() => handleOAuthSignIn("github")}
                disabled={isLoading}
              >
                <Github className="mr-2 h-5 w-5" />
                Github
              </Button>
              <Button 
                variant="outline" 
                className="h-12 bg-white/5 border-white/10 rounded-2xl hover:bg-white/10 hover:text-white transition-all font-bold"
                onClick={() => handleOAuthSignIn("google")}
                disabled={isLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
            <p className="text-zinc-500 text-sm font-medium">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[#0071eb] hover:underline font-bold"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </CardFooter>
        </Card>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
          &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; All Rights Reserved
        </p>
      </div>
    </div>
  )
}
