import sys
sys.path.append('.')
from app.core.utils.password_hash import verify_password
print("Verification result:", verify_password('AD2127404', '$2b$12$n/qJLVryAMnzkhUL.B/aJ.jUHZ4ggv08BQvU4VhM8H7.4/EBi8E0y'))
