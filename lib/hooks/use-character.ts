import { useState, useCallback, useEffect } from "react";
import { Character } from "@/lib/types";

/**
 * 角色 CRUD 操作 Hook
 */
export function useCharacter(id?: string) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/characters/${id}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error ?? "加载失败");
      
      setCharacter(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const refetch = useCallback(() => {
    void load();
  }, [load]);

  return { character, loading, error, refetch };
}

/**
 * 删除角色 Hook
 */
export function useDeleteCharacter() {
  const [deleting, setDeleting] = useState(false);

  const deleteCharacter = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true);
    
    try {
      const response = await fetch(`/api/characters/${id}`, { 
        method: "DELETE" 
      });
      
      if (!response.ok) {
        throw new Error("删除失败");
      }
      
      return true;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteCharacter, deleting };
}