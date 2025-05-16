const { serviceSupabase } = require('../config/supabase');

async function createUpvoteKarmaFunction() {
  try {
    console.log('Creating or updating handle_upvote_with_karma function...');

    // Try different approaches to create the function since exec_sql isn't available
    try {
      // First attempt: Try using raw_sql as suggested in the error hint
      const { error: rawSqlError } = await serviceSupabase.rpc('raw_sql', {
        query: `
          CREATE OR REPLACE FUNCTION handle_upvote_with_karma(
            p_advert_id UUID,
            p_user_id UUID,
            p_author_id UUID,
            p_already_upvoted BOOLEAN
          ) RETURNS VOID AS $$
          DECLARE
            karma_change INTEGER;
          BEGIN
            -- Determine karma change based on if we're adding or removing an upvote
            IF p_already_upvoted THEN
              -- Remove upvote
              DELETE FROM advert_upvotes
              WHERE advert_id = p_advert_id AND user_id = p_user_id;

              -- Decrement upvote count
              UPDATE adverts
              SET upvotes = GREATEST(upvotes - 1, 0)
              WHERE id = p_advert_id;

              karma_change := -1;
            ELSE
              -- Add upvote
              INSERT INTO advert_upvotes (advert_id, user_id, created_at)
              VALUES (p_advert_id, p_user_id, NOW());

              -- Increment upvote count
              UPDATE adverts
              SET upvotes = upvotes + 1
              WHERE id = p_advert_id;

              karma_change := 1;
            END IF;

            -- Update user's goodKarma count
            UPDATE users
            SET "goodKarma" = GREATEST("goodKarma" + karma_change, 0)
            WHERE id = p_author_id;
          END;
          $$ LANGUAGE plpgsql;
        `
      });

      if (rawSqlError) {
        console.log('Error creating function using raw_sql:', rawSqlError);
        throw rawSqlError;
      } else {
        console.log('Successfully created handle_upvote_with_karma function using raw_sql');
        return true;
      }
    } catch (rawSqlError) {
      console.log('raw_sql approach failed, trying direct SQL execution...');
      
      // We'll skip the function creation and implement the logic directly in the controller
      console.log('Will implement karma logic directly in controller instead of using a function');
      return false;
    }
  } catch (error) {
    console.error('Failed to create karma function:', error);
    // Don't throw the error, just return false
    return false;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createUpvoteKarmaFunction()
    .then((result) => console.log('Function creation completed with result:', result))
    .catch(err => console.error('Function creation failed:', err))
    .finally(() => process.exit());
}

module.exports = { createUpvoteKarmaFunction };