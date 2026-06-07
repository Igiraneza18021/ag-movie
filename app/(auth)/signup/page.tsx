"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"
import { Loader2, Github, Home as HomeIcon } from "lucide-react"
import { getTMDBImageUrl } from "@/lib/tmdb"
import type { Movie } from "@/lib/types"

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [backgroundMovies, setBackgroundMovies] = useState<Movie[]>([])
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    async function fetchBackgroundContent() {
      try {
        const { data } = await supabase
          .from("movies")
          .select("id, poster_path")
          .eq("status", "active")
          .limit(40)
        
        if (data) {
          const repeated = [...data, ...data, ...data].slice(0, 60)
          setBackgroundMovies(repeated as any)
        }
      } catch (error) {
        console.error("Error fetching background content:", error)
      }
    }
    fetchBackgroundContent()
  }, [supabase])

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast.success("Check your email for the verification code!")
      router.push(`/verify?email=${encodeURIComponent(values.email)}&type=signup`)
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
      {/* Top Right Home Button */}
      <div className="absolute top-6 right-6 z-50">
        <Link href="/">
          <Button variant="ghost" className="bg-black/20 hover:bg-white/10 text-white rounded-full px-6 border border-white/10 backdrop-blur-md font-black uppercase tracking-widest text-xs transition-all active:scale-95">
            <HomeIcon className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>

      {/* Cinematic Background Poster Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div 
          className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4 scale-125 -rotate-12 -translate-y-[10%] -translate-x-[5%]"
          style={{ width: '120%', height: '120%' }}
        >
          {backgroundMovies.map((movie, i) => (
            <div key={`${movie.id}-${i}`} className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl border border-white/5">
              <img
                src={getTMDBImageUrl(movie.poster_path, "w200")}
                alt=""
                className="object-cover w-full h-full grayscale-[0.4]"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
      </div>

      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0071eb]/20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#0071eb]/10 rounded-full blur-[120px] pointer-events-none z-0" />

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-12">
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
              Agasobanuye <span className="text-[#0071eb]">Movies</span>
            </h1>
          </Link>
        </div>

        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
              Create Account
            </h2>
            <p className="text-zinc-400 font-bold text-lg">
              Join the ultimate Agasobanuye community today
            </p>
          </div>

          <div className="grid gap-6">
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
                          className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg"
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
                          className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300 font-bold uppercase text-[10px] tracking-widest ml-1">Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="h-14 bg-white/10 border-white/10 backdrop-blur-md rounded-2xl focus:border-[#0071eb] focus:bg-white/15 transition-all text-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-14 bg-[#0071eb] hover:bg-[#0071eb]/90 text-white font-black uppercase tracking-wide rounded-2xl shadow-[0_10px_30px_rgba(0,113,235,0.4)] transition-all active:scale-95 disabled:opacity-70 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black">
                <span className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full text-zinc-400 border border-white/5">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="h-14 bg-white/5 border-white/10 backdrop-blur-md rounded-2xl hover:bg-white/15 hover:text-white transition-all font-black uppercase text-xs tracking-widest"
                onClick={() => handleOAuthSignIn("github")}
                disabled={isLoading}
              >
                <Github className="mr-2 h-5 w-5" />
                Github
              </Button>
              <Button 
                variant="outline" 
                className="h-14 bg-white/5 border-white/10 backdrop-blur-md rounded-2xl hover:bg-white/15 hover:text-white transition-all font-black uppercase text-xs tracking-widest"
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

            <div className="text-center pt-4">
              <p className="text-zinc-400 text-lg font-bold">
                Already have an account?{" "}
                <Link 
                  href="/login"
                  className="text-[#0071eb] hover:underline font-black uppercase tracking-tight"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-zinc-600 text-[10px] uppercase tracking-[0.2em] font-black pointer-events-none">
          &copy; {new Date().getFullYear()} Agasobanuye Movies &bull; All Rights Reserved
        </p>
      </div>
    </div>
  )
}
