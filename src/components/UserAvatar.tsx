"use client";

import { useState } from "react";
import Image from "next/image";
import { UserCircle } from "lucide-react";

interface UserAvatarProps {
    src?: string | null;
    name?: string | null;
    size?: "sm" | "md" | "lg";
}

export default function UserAvatar({ src, name, size = "md" }: UserAvatarProps) {
    const [error, setError] = useState(false);

    const sizeClasses = {
        sm: "w-10 h-10 rounded-xl",
        md: "w-14 h-14 rounded-2xl",
        lg: "w-20 h-20 rounded-3xl",
    };

    const iconSizes = {
        sm: 20,
        md: 32,
        lg: 48,
    };

    return (
        <div className={`relative ${sizeClasses[size]} overflow-hidden border-2 border-white/10 shadow-xl bg-slate-800 flex-shrink-0 flex items-center justify-center`}>
            {src && !error ? (
                <Image
                    src={src}
                    alt={name || "User"}
                    fill
                    className="object-cover"
                    onError={() => setError(true)}
                />
            ) : (
                <UserCircle
                    className="text-slate-500"
                    size={iconSizes[size]}
                />
            )}
        </div>
    );
}
