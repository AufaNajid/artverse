# Your ARTVERSE studio

Complete the [Supabase setup guide](cms-setup.md) before using the private CMS. The setup creates your owner account, database, private image storage, and initial portfolio records. Until then, the sign-in page shows **Setup needed**. Authenticated publishing and uploads need a real Supabase connection; this guide does not imply that live CRUD has been tested.

## Sign in

Open `/login` and use the email and password for the owner account you created in Supabase. Only that owner can access `/dashboard`. There is no public registration page. Use **View portfolio** to open your public site in another tab.

## Add or edit an artwork

1. Choose **New artwork** or open an existing piece under **Artworks**.
2. Enter a title and category. Add an optional description, year, tools, tags, idea, and approach.
3. Upload a cover. PNG, JPG, and WebP are supported, up to **10 MB per image**. Each artwork can contain **15 images in total, including its cover**. An upload can take a moment while the studio validates it and prepares its 3D thumbnail.
4. Write a cover image description that explains what someone would see. This alt text is required to publish. You can also describe each gallery image.
5. Add gallery images as needed. Use their arrow buttons to change the order; **Remove** excludes an image from the next save. Replacing or removing an unsaved upload discards that unused upload when possible.
6. Choose **Save draft** to keep the artwork private, or **Publish artwork** to make it visible in the portfolio and 3D gallery. Uploading an image alone does not save the artwork’s changes.

The studio may create a private draft before the first image upload. Use **Save draft** afterward to attach the upload and save the remaining details. The save bar shows whether you have unsaved changes. Save before leaving the editor.

**Feature this artwork** adds a published piece to the homepage selection. The background color controls the artwork’s portfolio background.

## Publish, unpublish, and URLs

Publishing requires a title, category, cover, and cover alt text. Once a piece is published, use **Save changes** to update it. **Unpublish** saves it as a private draft and removes it from public listings and the 3D gallery.

You can edit the portfolio URL before the first publication. After the first publication, that URL is permanently locked, even if you later unpublish the piece. This keeps existing links consistent.

## Organize or delete your collection

Under **Artworks**, search by title, description, or tag, and filter by status or category. Clear the filters to use the up/down arrows to arrange the portfolio order. Gallery image order is managed separately inside each artwork.

Choose **Delete** beside a piece to open its confirmation dialog. **Keep artwork** cancels the action. **Delete artwork** permanently removes its metadata and queues its uploaded images for removal. Deletion cannot be undone.

## Update your profile

Open **Profile & settings** to change your artist name, bio, avatar, Instagram handle, or public contact email. Uploading a new avatar still requires **Save profile**. Leave Instagram or public email empty to hide that contact method.

The public contact email is separate from your private sign-in account. Changing it does not change your login credentials.

## Image cleanup

The **Maintenance** section on **Overview** includes **Retry image cleanup**. Use it after a storage connection issue or when queued removals remain. It processes already queued removals and expired, unused uploads; it does not remove images still attached to your artwork or profile.

The result shows completed removals and any pending queue items. If items remain, check your storage setup and connection, then retry. Cleanup runs in small batches, so another retry may be needed.

Removed images become inaccessible through the portfolio immediately. Physical file cleanup waits at least 2 hours and 5 minutes after removal so an outstanding upload token cannot recreate a file after cleanup. Pending jobs inside that waiting period are normal; retry after the period has passed.

## Sign out and recover access

Choose **Sign out** in the studio navigation when finished, especially on a shared computer.

If you lose access, ask the administrator of your Supabase project to reset the owner account’s password or restore the account. Keep the configured owner user ID consistent with the project setup; changing the public artist name or contact email will not recover sign-in access. See the [setup guide](cms-setup.md) when checking environment variables, account configuration, or storage permissions.
