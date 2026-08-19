#!/bin/bash
# Blog Manager Cron Job - Runs every Tuesday at 9 AM for publishing
# Schedule: 0 9 * * 2

BLOG_DIR="/var/www/psdepot.com/blog"
LOG_FILE="/var/www/psdepot.com/blog/CRON_LOG.txt"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Blog Manager Cron Started" >> $LOG_FILE

# Check for scheduled articles in DRAFTS/
if [ -d "$BLOG_DIR/DRAFTS" ]; then
    for draft in $BLOG_DIR/DRAFTS/*.html; do
        if [ -f "$draft" ]; then
            filename=$(basename "$draft")
            # Move from DRAFTS to live blog
            mv "$draft" "$BLOG_DIR/$filename"
            echo "[$DATE] Published: $filename" >> $LOG_FILE
            
            # Update sitemap
            /usr/bin/python3 /var/www/psdepot.com/blog/update_sitemap.py "$filename"
        fi
    done
fi

echo "[$DATE] Blog Manager Cron Complete" >> $LOG_FILE
