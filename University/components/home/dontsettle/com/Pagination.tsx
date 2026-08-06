'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div id="pagination" className="pagination-container">
      <ul className="pagination justify-content-center">
        {currentPage > 1 && (
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </button>
          </li>
        )}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <li
            key={page}
            className={`page-item ${page === currentPage ? 'active' : ''}`}
          >
            <button
              className="page-link"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          </li>
        ))}
        {currentPage < totalPages && (
          <li className="page-item">
            <button
              className="page-link"
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}