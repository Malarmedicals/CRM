"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from "@/lib/utils"
// import { ChevronDown, ChevronRight } from 'lucide-react' // If you want to use Lucide icons instead
// Note: You provided FontAwesome classes (fa-solid). Ensure FontAwesome is loaded in your project.
import { categoryService } from '@/features/categories/category-service'

interface Subcategory {
    name: string;
    subItems?: string[];
}

interface Category {
    name: string;
    icon: string;
    subcategories: Subcategory[];
}

const ICON_MAP: Record<string, string> = {
    'Haircare': 'fa-solid fa-pump-soap',
    'Fitness & Wellness': 'fa-solid fa-dumbbell',
    'Sexual Wellness': 'fa-solid fa-heart-pulse',
    'Vitamins & Nutrition': 'fa-solid fa-tablets',
    'Supports & Braces': 'fa-solid fa-crutch',
    'Immunity Boosters': 'fa-solid fa-shield-virus',
    'Homeopathy': 'fa-solid fa-leaf',
    'First Aid': 'fa-solid fa-kit-medical',
}

export function Navigation() {
    const router = useRouter();
    const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await categoryService.getAllCategories();
                const mappedCategories: Category[] = data.map(cat => ({
                    name: cat.name,
                    icon: ICON_MAP[cat.name] || 'fa-solid fa-notes-medical',
                    subcategories: (cat.subcategories || []).map(sub => ({
                        name: sub,
                        // subItems not supported in current DB schema
                    }))
                }));
                // Sort by predefined order in ICON_MAP if desired, or just alphabetical/creation
                // For now, let's keep DB order (which might be random/creation id based)
                setCategories(mappedCategories);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };

        fetchCategories();
    }, []);

    return (
        <nav className="w-full bg-white border-b relative z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <ul className="flex items-center gap-8">
                        {categories.map((category, index) => (
                            <li
                                key={index}
                                className="relative group h-16 flex items-center"
                                onMouseEnter={() => setHoveredCategory(index)}
                                onMouseLeave={() => setHoveredCategory(null)}
                            >
                                <Link
                                    href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-primary transition-colors"
                                >
                                    <i className={cn(category.icon, "text-lg")} />
                                    {category.name}
                                </Link>

                                {/* Dropdown / Mega Menu */}
                                {hoveredCategory === index && (
                                    <div className="absolute top-16 left-0 w-64 bg-white shadow-xl border rounded-b-xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-1">
                                        {category.subcategories.map((sub, subIndex) => (
                                            <div key={subIndex} className="px-4 py-2 hover:bg-slate-50 transition-colors">
                                                <Link
                                                    href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}/${sub.name.toLowerCase().replace(/\s+/g, '-')}`}
                                                    className="text-sm text-slate-700 hover:text-primary block font-medium"
                                                >
                                                    {sub.name}
                                                </Link>
                                                {sub.subItems && (
                                                    <div className="ml-4 mt-1 border-l-2 border-slate-100 pl-2 space-y-1">
                                                        {sub.subItems.map((item, itemIndex) => (
                                                            <Link
                                                                key={itemIndex}
                                                                href={`/category/${category.name.toLowerCase().replace(/\s+/g, '-')}/${sub.name.toLowerCase().replace(/\s+/g, '-')}/${item.toLowerCase().replace(/\s+/g, '-')}`}
                                                                className="block text-xs text-muted-foreground hover:text-primary"
                                                            >
                                                                {item}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    )
}
