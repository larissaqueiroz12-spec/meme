import { Outlet, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Moon, Sun, Home, PlusSquare, User, LogOut, MessageSquare } from 'lucide-react'

export default function Layout() {
  const { signOut, user } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 md:px-8">
          <div className="mr-4 flex">
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold sm:inline-block text-primary text-xl">
                MemeSocial
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="icon"><Home className="h-5 w-5" /></Button>
              </Link>
              <Link to="/upload">
                <Button variant="ghost" size="icon"><PlusSquare className="h-5 w-5" /></Button>
              </Link>
              <Link to="/chat">
                <Button variant="ghost" size="icon"><MessageSquare className="h-5 w-5" /></Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="icon"><User className="h-5 w-5" /></Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-5 w-5 text-destructive" />
              </Button>

              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="@user" />
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-6 md:px-8 max-w-4xl">
        <Outlet />
      </main>
    </div>
  )
}
