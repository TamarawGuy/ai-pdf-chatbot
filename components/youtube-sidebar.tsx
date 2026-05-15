"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MonitorPlay,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteYoutubeChatAction,
  renameYoutubeChatAction,
} from "@/app/youtube-bot/actions";

type YoutubeChatListItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export default function YoutubeSidebar({
  chats,
}: {
  chats: YoutubeChatListItem[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [renameTarget, setRenameTarget] = useState<YoutubeChatListItem | null>(
    null,
  );
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeId = pathname?.startsWith("/youtube-bot/")
    ? pathname.slice("/youtube-bot/".length)
    : null;

  const handleRename = () => {
    if (!renameTarget) return;
    const title = renameValue;
    const targetId = renameTarget.id;
    startTransition(async () => {
      await renameYoutubeChatAction(targetId, title);
      setRenameTarget(null);
      router.refresh();
    });
  };

  const handleDelete = (chatId: string) => {
    startTransition(async () => {
      await deleteYoutubeChatAction(chatId);
      if (activeId === chatId) {
        router.push("/youtube-bot");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/youtube-bot">
                  <PlusIcon />
                  <span>New video</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Videos</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">
                    No videos yet.
                  </p>
                ) : (
                  chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={activeId === chat.id}
                      >
                        <Link href={`/youtube-bot/${chat.id}`}>
                          <MonitorPlay />
                          <span className="truncate">{chat.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            showOnHover
                            aria-label="Video chat actions"
                          >
                            <MoreHorizontalIcon />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onSelect={() => {
                              setRenameTarget(chat);
                              setRenameValue(chat.title);
                            }}
                          >
                            <PencilIcon />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => handleDelete(chat.id)}
                          >
                            <TrashIcon />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Chat title"
            maxLength={60}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isPending || !renameValue.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
