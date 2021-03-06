<?php

    $sLetters   = $_REQUEST['sLetters'];
    $nMinLength = $_REQUEST['nMinLength'];

    $aWords = getWordList($sLetters, $nMinLength);

    echo json_encode($aWords);

    exit();

    function getWordList($sSearchString, $nMinLength)
	{
        $status  = "success";
        $message = "";
        $sFile   = "linuxwords.txt";
        $aWords  = array();
        $oOccurs = array();
        $nSSLen  = strlen($sSearchString);

        $sSearchString = strtolower($sSearchString);

        try
        {
            for($i = 0; $i < $nSSLen; $i++)
            {
                $sChar = substr($sSearchString, $i, 1);
                if(isset($oOccurs[$sChar]))
                {
                    $oOccurs[$sChar] += 1;
                }
                else
                {
                    $oOccurs[$sChar] = 1;
                }
            }


            if ($oFile = fopen($sFile, 'r'))
            {
                while (!feof($oFile))
                {
                    $sWord = trim( fgets($oFile) );
                    $sWord = strtolower($sWord);

                    $nWordLen = strlen($sWord);
                    if( $nWordLen < 8 && $nWordLen >= $nMinLength )
                    {
                        $aMatch = array();
                        preg_match("/\d+|\W+/i", $sWord, $aMatch);
                        if(count($aMatch) === 0)
                        {
                            $bAddWord = false;
                            $oLetterCount = array();

                            for($j = 0; $j < $nWordLen; $j++)
                            {
                                $sChar = substr( $sWord, $j, 1 );
                                $nPos  = strpos( $sSearchString, $sChar );

                                if( isset($oLetterCount[$sChar]) )
                                {
                                    $oLetterCount[$sChar] += 1;
                                }
                                else
                                {
                                    $oLetterCount[$sChar] = 1;
                                }

                                if( $nPos === false || $oLetterCount[$sChar] > $oOccurs[$sChar] )
                                {
                                    $bAddWord = false;
                                    break;
                                }
                                else
                                {
                                    $bAddWord = true;
                                }
                            }

                            if( $bAddWord )
                            {
                                if( !in_array( $sWord, $aWords ))
                                {
                                    $aWords[] = $sWord;
                                }
                            }
                        }
                    }
                }
                fclose($oFile);
                sort($aWords);
            }
            else
            {
                $status = "error";
                $message = "Unable to open word list";
            }
        }
        catch(Exception $e) {
            $status  = "failed";
            $message = "Error during processing: " . $e->getMessage();
            $aWords  = array();
        }

		$result = array(
			"status"	=> $status,
			"message"	=> $message,
			"content"	=> $aWords
		);

        return $result;
	}


?>