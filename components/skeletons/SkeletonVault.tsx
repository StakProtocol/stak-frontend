
export function SkeletonVault() {
    return (
        <div>
            <div className="bg-white dark:bg-primary/40 rounded-2xl shadow-lg p-8 mb-8 animate-pulse">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <div className="h-12 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-50 dark:bg-dark-primary rounded-xl p-4">
                            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    ))}
                </div>

                <div className="mb-8 mt-20">
                    <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i}>
                                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                                <div className="flex flex-col items-center">
                                    <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="flex flex-col gap-3 mt-4 w-full max-w-[200px]">
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mb-8 mt-20">
                    <div className="mb-4">
                        <div className="h-8 w-96 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>

                <div className="mt-8">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}