<?php
	define('LIBRARY_CHECK',true);
	require 'php/library.php';

	date_default_timezone_set('America/New_York');

	if(isset($_GET['logout']))
	{
		session_destroy();
		$_SESSION = array();
		header("Location: login.php");
		exit;
	}

	if(!isset($_SESSION))
	{
		session_name('andrewscal');
		session_start();
	}

	if(!isset($_SESSION['username']) || !isset($_SESSION['userid']))
	{
		header('Location: login.php');
	}
	else
	{
		$cyear = date('Y');
		$nummonth = date('n');

		$months = array(1  => "January",
						2  => "February",
						3  => "March",
						4  => "April",
						5  => "May",
						6  => "June",
						7  => "July",
						8  => "August",
						9  => "September",
						10 => "October",
						11 => "November",
						12 => "December");

        $yeararray = array();
        $yearquery = mysql_query("SELECT DISTINCT TSYEAR AS years FROM timesheet ORDER BY years ASC;");
        while($row = mysql_fetch_assoc($yearquery))
		{
			array_push($yeararray, $row['years']);
		}

        $endyear = $yeararray[count($yeararray) - 1];
        $endyear++;
        array_push($yeararray, $endyear);
		$yearhtml = "";
		for($i = 0; $i < count($yeararray); $i++)
		{
			$sel = ($yeararray[$i] == $cyear) ? " selected" : "";
			$yearhtml .= "<option value='" . $yeararray[$i] . "'" . $sel . ">" . $yeararray[$i] . "</option>";
		}

		$monthhtml = "";
		foreach ($months as $num => $name)
		{
			$sel = ($num == $nummonth) ? " selected" : "";
			$monthhtml .= "<option value='" . $num . "'" . $sel . ">" . $name . "</option>";
		}

		$tsinfo = getMonthInfo(array("month" => $nummonth, "year" => $cyear, "userid" => $_SESSION['userid'], "firstload" => 1));

		$maintablehtml = $tsinfo['content']['mainhtml'];
		$sidetablehtml = $tsinfo['content']['sidehtml'];
		$finalsidetablehtml = $tsinfo['content']['finalhtml'];
		$headstring = $tsinfo['content']['headstr'];

		$nameinfo = mysql_fetch_assoc(mysql_query("SELECT FIRST, LAST FROM eventadmin WHERE ID=" . $_SESSION['userid'] . ";"));
		$name = $nameinfo['FIRST'] . " " . $nameinfo['LAST'];
		$fname = $nameinfo['FIRST'];
	}
?>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11-strict.dtd">
<html>
	<head>
		<title>Tim's Work Schedule</title>
		<link rel="icon" type="image/png" href="images/calicon.png">
		<link rel='stylesheet' href='css/timesheet.css' type="text/css" media="screen" charset="utf-8">
		<link rel='stylesheet' href='css/fusionlib.css' type="text/css" media="screen" charset="utf-8">
		<link rel='stylesheet' href='css/jquery-ui.min.css' type="text/css" media="screen" charset="utf-8">
		<link rel='stylesheet' href='css/jquery.timepicker.css' type="text/css" media="screen" charset="utf-8">
		<link rel="stylesheet" type="text/css" href="http://fonts.googleapis.com/css?family=Open+Sans">
		<script language="javascript" type="text/javascript" src="javascript/jquery-1.11.0.min.js"></script>
		<script language="javascript" type="text/javascript" src="javascript/jquery-ui-1.10.4.custom.min.js"></script>
		<script language="javascript" type="text/javascript" src="javascript/moment.js"></script>
		<script language="javascript" type="text/javascript" src="javascript/jquery.timepicker.js"></script>
		<script language="javascript" type="text/javascript" src="javascript/fusionlib.js"></script>
		<script language="javascript" type="text/javascript" src="javascript/tsjs.js"></script>
	</head>
	<body>

<!--	<div id="fusion_left_click_menu"></div>//-->

		<div id="header" class="header">
			<div id="headercont" class="header-content">
				<div class="header-logo">
					<div class="logowrapper">
						<div class="title">
							<div id="titlediv" class="titletext">
								MySchedule
							</div>
						</div>
					</div>
				</div>
				<div class="h100fl" style="float:left;width:400px;height:100%;">
					<div style="width:100%;height:100%;">
						<div class="h100fl" style="width:100px;line-height:56px;text-align:center;">
                            <button id="previousbutton" class="nav-buttons" style="border-radius:4px;" onclick="getPreviousMonth()">
                                <span id="legud" class="menuopen" style="display: inline-block;float: left;margin-top: 11px;width:20px;height: 12px;background-image:url(../images/iconic/chevron-left-2x.png)"></span>
                                Prev
                            </button>
						</div>
						<div class="h100fl" style="width:100px;line-height:60px;">
							<select id="month" style="width:90px;" onchange="refreshTimesheet()">
								<?php echo $monthhtml; ?>
							</select>
							<span style="">,</span>
						</div>
						<div class="h100fl" style="width:100px;line-height:60px;">
							<select id="year" style="width:90px;margin-left:10px;" onchange="refreshTimesheet()">
								<?php echo $yearhtml; ?>
							</select>
						</div>
						<div class="h100fl" style="width:100px;line-height:56px;text-align:center;">
                            <button id="nextbutton" class="nav-buttons" style="border-radius:4px;" onclick="getNextMonth()">
                                Next
                                <span id="legud" class="menuopen" style="display:inline-block;float:right;margin-top:11px;margin-left:10px;width:10px;height: 12px;background-image:url(../images/iconic/chevron-right-2x.png)"></span>
                            </button>
						</div>
					</div>
				</div>
				<div style="float:right;">
					<div class="header-search" style="width:110px;">
						<div id="legendmenu" class="header-nav">
							<span>Menu</span>
							<span id="legud" class="menuopen"
								  style="display:block;float:right;font-size:12px;margin-top:8px;margin-left:5px;width:20px;height:20px;"></span>
							<div class="container">
								<div class="legcont">
									<div id="legholidaytext" class="noselect" style="line-height: 3em; margin-left: 15px;">
										<a style="text-decoration: none; display: block; width: 100%; height: 100%;" href="scheduleadmin.php">
											Update Name/Password
										</a>
									</div>
								</div>
								<div class="legcont">
									<div id="legholidaytext" class="noselect" style="line-height: 3em; margin-left: 15px;">
										<a href="timesheet.php?logout" style="text-decoration:none; display: block; width: 100%; height: 100%;">
											Logout
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="header-search">
						<div class="w100fl h100fl" id="srchcont" style="line-height:60px;">
							<label style="display:block;margin-right:5px;">Welcome, <?php echo $fname; ?>!</label>
							<img src='images/iconic/person-2x.png' style="width:12px;" />
						</div>
					</div>
				</div>
			</div>
		</div>
		<div id="mainwrapper" class="mainwrapper">
			<div id="contentwrapper" class="wrapper">
				<div id="maintablewrapper" style="width:680px;float:left;">
					<table id="maintable" style="margin-top:20px;">
						<thead>
							<tr style="border:2px solid;">
								<th class="maintablecol">Date</th>
								<th class="maintablecol">Start</th>
								<th class="maintablecol">Begin Break</th>
								<th class="maintablecol">End Break</th>
								<th class="maintablecol">End</th>
								<th class="maintablecol">Hours</th>
								<th class="maintablecol">Leave/PTO</th>
							</tr>
						</thead>
						<tbody id="maintabletbody">
							<?php echo $maintablehtml; ?>
						</tbody>
					</table>
					<span id="maintemp" style="visibility:hidden;"></span>
				</div>
				<div id="sidetablewrapper" style="width:400px;float:left;">
					<table id="sidetable" style="float:right;">
						<thead>
							<tr style="border:2px solid;">
								<th id="sidetableheader" colspan="3" style="background-color:#CFC;">
									<?php echo $headstring; ?>
								</th>
							</tr>
							<tr style="border:2px solid;">
								<th style="width:100px;">Day</th>
								<th style="width:75px;">Hours</th>
								<th style="width:170px;text-align:left;">Note</th>
							</tr>
						</thead>
						<tbody id="sidetabletbody">
							<?php echo $sidetablehtml; ?>
							<?php echo $finalsidetablehtml; ?>
						</tbody>
					</table>
					<span id="sidetemp" style="visibility:hidden;"></span>
				</div>
			</div>
		</div>
		<input type="hidden" id="userid" value="<?php echo $_SESSION['userid']; ?>" />

		<div id="newtimeform" title="New Timesheet Entry">
			<div>
				<form id="ntform">
					<input type="hidden" id="dateid" value="" />
					<div class="fielddivs" style="padding-top:15px;">
						<div class="userdivs">Start: </div>
						<input id="starttime" type="text" class="time ui-timepicker-input" data-time-format="H:i:s" style="width:170px" autocomplete="off">
					</div>
					<div class="fielddivs">
						<div class="userdivs">Begin Break: </div>
						<input id="startbreaktime" type="text" class="time ui-timepicker-input" data-time-format="H:i:s" style="width:170px" autocomplete="off">
					</div>
					<div class="fielddivs">
						<div class="userdivs">End Break: </div>
						<input id="endbreaktime" type="text" class="time ui-timepicker-input" data-time-format="H:i:s" style="width:170px" autocomplete="off">
					</div>
					<div class="fielddivs">
						<div class="userdivs">End: </div>
						<input id="endtime" type="text" class="time ui-timepicker-input" data-time-format="H:i:s" style="width:170px" autocomplete="off">
					</div>
					<div class="fielddivs">
						<div class="userdivs">Holiday: </div>
						<input type="text" id="pto" class="userinputs" style="width:170px" value="" />
					</div>
					<div class="fielddivs">
						<div class="userdivs">Leave/PTO: </div>
						<input type="text" id="leave" class="userinputs" style="width:170px" value="" />
					</div>
					<div class="fielddivs">
						<div class="userdivs">Note: </div>
						<input type="text" id="note" class="userinputs" style="width:170px" value="" />
					</div>
					<div class="fielddivs" style="text-align: center;">
						<input type="button" class="createuserbtn" value="Update Entry" onclick="addUpdateTimeEntry()" />
						<input type="button" class="createuserbtn" value="Cancel" onclick="hideNewTimeForm()" />
					</div>
				</form>
			</div>
		</div>
		<div style="width: 100%; bottom: 0px; float: left;"></div>
	</body>
</html>
