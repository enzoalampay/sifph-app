"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useEntityStorage } from "@/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { Player, createPlayer } from "@/lib/types/player";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function PlayersPage() {
  const { items: players, save, remove, loaded } = useEntityStorage<Player>(STORAGE_KEYS.PLAYERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [nameError, setNameError] = useState("");

  const handleCreate = useCallback(() => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setNameError("Name is required");
      return;
    }
    const player = createPlayer(trimmed, newNickname.trim() || undefined);
    save(player);
    setNewName("");
    setNewNickname("");
    setNameError("");
    setModalOpen(false);
  }, [newName, newNickname, save]);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      remove(id);
    },
    [remove]
  );

  const openModal = useCallback(() => {
    setNewName("");
    setNewNickname("");
    setNameError("");
    setModalOpen(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-400 text-sm">Loading players...</div>
      </div>
    );
  }

  const sortedPlayers = [...players].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-stone-900 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Players"
        description={`${players.length} registered player${players.length !== 1 ? "s" : ""}`}
        action={
          <Button onClick={openModal}>
            Add Player
          </Button>
        }
      />

      {players.length === 0 ? (
        <EmptyState
          title="No Players Yet"
          description="Add your first player to start tracking tournament stats and match history."
          action={
            <Button onClick={openModal}>
              Add Player
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPlayers.map((player) => (
            <Link key={player.id} href={`/players/${player.id}`}>
              <Card hover className="group relative">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-stone-100 truncate">
                      {player.name}
                    </h3>
                    {player.nickname && (
                      <p className="text-sm text-amber-500 truncate">
                        &ldquo;{player.nickname}&rdquo;
                      </p>
                    )}
                    <p className="mt-2 text-xs text-stone-500">
                      Joined {new Date(player.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-500 hover:text-red-400"
                    onClick={(e) => handleDelete(e, player.id)}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Player">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Enter player name"
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (nameError) setNameError("");
            }}
            error={nameError}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <Input
            label="Nickname (optional)"
            placeholder="Enter nickname"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create Player
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </ProtectedRoute>
  );
}
