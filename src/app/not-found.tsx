// ! TODO: Get HTTP status code from the server and display it here

const NotFoundPage = () => {
  return (
    <div
      className="flex justify-center items-center min-h-screen"
      data-cy="not-found-page"
    >
      <h1 className="font-bold text-white text-xl">Page Not Found</h1>
    </div>
  );
};

export default NotFoundPage;
