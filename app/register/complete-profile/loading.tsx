export default function CompleteProfileLoading() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Title */}
                <div className="h-9 w-48 bg-gray-200 rounded mx-auto mb-3 animate-pulse" />
                <div className="h-4 w-72 bg-gray-100 rounded mx-auto animate-pulse" />
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="space-y-6">
                        {/* Title + First Name row */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                                <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                                <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                            </div>
                            <div className="col-span-8">
                                <div className="h-4 w-12 bg-gray-200 rounded mb-2 animate-pulse" />
                                <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                            </div>
                        </div>

                        {/* Last Name */}
                        <div>
                            <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                        </div>

                        {/* Phone */}
                        <div>
                            <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                        </div>

                        {/* User ID */}
                        <div>
                            <div className="h-4 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                        </div>

                        {/* User Type */}
                        <div>
                            <div className="h-4 w-28 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                        </div>

                        {/* Department */}
                        <div>
                            <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                        </div>

                        {/* Turnstile Placeholder + Submit */}
                        <div>
                            <div className="h-16 w-full bg-gray-100 rounded mb-4 animate-pulse" />
                            <div className="h-10 bg-indigo-200 rounded-md animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
