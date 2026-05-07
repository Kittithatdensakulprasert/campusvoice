import React from 'react';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  showPageInfo = true,
  totalItems
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || totalPages * itemsPerPage);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSelect = (page) => {
    onPageChange(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    } else {
      onPageChange(1);
    }
  };

  // Generate page numbers to show
  const getVisiblePages = () => {
    const delta = 2;
    const rangeWithDots = [];
    let leftDotsAdded = false;
    let rightDotsAdded = false;

    for (let i = 1; i <= totalPages; i++) {
      const isEdge = i === 1 || i === totalPages;
      const isNearCurrent = i >= currentPage - delta && i <= currentPage + delta;

      if (isEdge || isNearCurrent) {
        rangeWithDots.push(i);
      } else if (i < currentPage - delta && !leftDotsAdded) {
        rangeWithDots.push('...');
        leftDotsAdded = true;
      } else if (i > currentPage + delta && !rightDotsAdded) {
        rangeWithDots.push('...');
        rightDotsAdded = true;
      }
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="pagination">
      <div className="pagination-info">
        {showPageInfo && (
          <span className="pagination-text">
            แสดง {startItem}-{endItem} จาก {totalItems} รายการ
          </span>
        )}
      </div>

      <div className="pagination-controls">
        <button 
          className="pagination-btn pagination-btn--prev"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          aria-label="หน้าก่อน"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7 7" />
          </svg>
        </button>

        <div className="pagination-numbers">
          {visiblePages.map((page, index) => (
            <button
              key={index}
              className={`pagination-number ${currentPage === page ? 'pagination-number--active' : ''}`}
              onClick={() => handlePageSelect(page)}
              aria-label={`หน้า ${page}`}
              aria-current={currentPage === page}
            >
              {page === '...' ? '...' : page}
            </button>
          ))}
        </div>

        <button 
          className="pagination-btn pagination-btn--next"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="หน้าถัดไป"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7" />
          </svg>
        </button>
      </div>

      {itemsPerPage > 0 && (
        <div className="pagination-per-page">
          <span className="pagination-text">แสดง:</span>
          <select 
            className="pagination-select"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            aria-label="จำนวนต่อหน้า"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="pagination-text">รายการ</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;
