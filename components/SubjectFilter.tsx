'use client'
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const SubjectFilter = () => {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const query = searchParams.get('subject')
    const [selectedSubject, setSelectedSubject] = useState(query || '')
    const [isOpen, setIsOpen] = useState(false)

    const subjects = [
        "maths",
        "science", 
        "language",
        "coding",
        "history",
        "economics"
    ]

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString())
            
            if (selectedSubject) {
                params.set('subject', selectedSubject)
            } else {
                params.delete('subject')
            }

            const newUrl = `${pathname}?${params.toString()}`
            router.push(newUrl, { scroll: false })
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [selectedSubject, router, searchParams, pathname])

    useEffect(() => {
        // Update local state when URL changes
        const currentSubject = searchParams.get('subject') || ''
        setSelectedSubject(currentSubject)
    }, [searchParams])

    const handleSubjectSelect = (subject: string) => {
        // If clicking the same subject, deselect it
        const newSubject = subject === selectedSubject ? '' : subject
        setSelectedSubject(newSubject)
        setIsOpen(false)
    }

    const displayText = selectedSubject || "Select subject..."

    return (
        <div className="relative border border-black rounded-lg px-3 py-2 h-fit min-w-[200px]">
            <div 
                className="flex justify-between items-center w-full cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={selectedSubject ? "text-black" : "text-gray-500"}>
                    {displayText}
                </span>
                <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                </span>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-black rounded-lg mt-1 shadow-lg z-10 max-h-60 overflow-y-auto">
                    {subjects.map((subject) => (
                        <div
                            key={subject}
                            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                                selectedSubject === subject ? 'bg-blue-50 text-blue-600 font-medium' : ''
                            }`}
                            onClick={() => handleSubjectSelect(subject)}
                        >
                            {subject}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default SubjectFilter