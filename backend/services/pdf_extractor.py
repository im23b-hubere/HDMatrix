import os
import logging
import fitz  # PyMuPDF
from typing import Tuple, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PDFExtractor:
    """PDF Text Extractor with error handling and fallback options"""
    
    @staticmethod
    def extract_text(file_path: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract text from a PDF file
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Tuple[Optional[str], Optional[str]]: (extracted text, error message)
        """
        if not os.path.exists(file_path):
            return None, "PDF file not found"
            
        try:
            doc = fitz.open(file_path)
            
            # Check if PDF is encrypted
            if doc.needs_pass:
                doc.close()
                return None, "PDF is password protected"
                
            extracted_text = ""
            
            # Extract text from each page
            for page_num, page in enumerate(doc, 1):
                try:
                    # Try normal text extraction
                    text = page.get_text()
                    
                    # If no text found, try HTML extraction
                    if not text.strip():
                        text = page.get_text("html")
                        logger.info(f"Using HTML extraction for page {page_num}")
                    
                    extracted_text += text + "\n"
                    
                except Exception as e:
                    logger.warning(f"Error extracting text on page {page_num}: {str(e)}")
                    continue
                    
            doc.close()
            
            # Check if text was extracted
            if not extracted_text.strip():
                return None, "No text found in PDF"
                
            # Normalize the text
            normalized_text = " ".join(extracted_text.split())
            logger.info(f"Text successfully extracted: {len(normalized_text)} characters")
            
            return normalized_text, None
            
        except fitz.FileDataError:
            return None, "Invalid PDF format"
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            return None, f"PDF processing error: {str(e)}"

    def is_valid_pdf(self, pdf_path: str) -> bool:
        """
        Check if a file is a valid PDF.
        """
        try:
            doc = fitz.open(pdf_path)
            is_valid = doc.is_pdf
            doc.close()
            return is_valid
        except Exception:
            return False 