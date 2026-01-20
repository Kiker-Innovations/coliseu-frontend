/**
 * Full Page Spinner Component
 * Used for page loading states, authentication checks, and access verification
 * No text is displayed to avoid exposing internal processes to the user
 */

import { Loader2 } from "lucide-react";

export function FullPageSpinner() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<Loader2 className="h-8 w-8 animate-spin text-primary" />
		</div>
	);
}


