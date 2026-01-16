export function SkeletonVaultList() {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-dark-primary rounded-xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                            <div className="h-7 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}