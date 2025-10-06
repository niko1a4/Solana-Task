export default function ErrorState({ message = 'Something went wrong.' }: { message?: string }) {
    return <div className="py-20 text-center text-red-600">{message}</div>;
}
