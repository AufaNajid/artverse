/** Safe, serializable profile fields that may be sent to the public browser. */
export type PublicProfile = {
  name: string;
  bio: string;
  avatarUrl: string | null;
  instagram: string | null;
  email: string | null;
};
