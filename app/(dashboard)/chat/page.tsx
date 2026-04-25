import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="h-full">
      <ChatInterface session={session!} />
    </div>
  )
}
