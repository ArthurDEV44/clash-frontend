import React from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const DeleteAllClashesButton: React.FC = () => {
  const handleDeleteAllClashes = async () => {
    if (window.confirm('Are you sure you want to delete all clashes? This action cannot be undone.')) {
      try {
        const response = await fetch(`${backendUrl}/clash`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('All clashes deleted successfully.');
        } else {
          const errorData = await response.json();
          console.error('Error deleting clashes:', errorData.error);
          alert('Failed to delete clashes.');
        }
      } catch (error) {
        console.error('Error deleting clashes:', error);
        alert('An error occurred while deleting clashes.');
      }
    }
  };

  return (
    <button
      className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-all duration-300"
      onClick={handleDeleteAllClashes}
    >
      Supprimer tous les clashs
    </button>
  );
};

export default DeleteAllClashesButton;
